import { supabase } from '@/lib/supabase'
import type {
  Profile,
  WorkspaceContext,
  WorkspaceDirectoryMember,
  WorkspaceInviteCandidate,
  WorkspaceMember,
  WorkspaceRelationship,
} from '@/lib/workspace/types'

function getErrorCode(error: unknown) {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return String((error as { code?: unknown }).code ?? '')
  }

  return ''
}

function getErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message?: unknown }).message ?? '')
  }

  if (error instanceof Error) return error.message
  return ''
}

function isWorkspaceSchemaMissing(error: unknown) {
  const code = getErrorCode(error)
  const message = getErrorMessage(error)

  return (
    code === '42P01'
    || code === 'PGRST205'
    || /nmm_workspace/i.test(message)
    || /relation .* does not exist/i.test(message)
    || /Could not find the table/i.test(message)
  )
}

type MembershipRow = WorkspaceMember
type ProfileRow = Pick<Profile, 'id' | 'full_name' | 'email' | 'role' | 'avatar_url' | 'company'>
type RelationshipRow = Pick<WorkspaceRelationship, 'member_user_id' | 'sponsor_user_id' | 'depth'>

async function resolveWorkspaceDepth(workspaceId: string, sponsorUserId: string) {
  const { data, error } = await supabase
    .from('nmm_member_relationships')
    .select('depth')
    .eq('workspace_id', workspaceId)
    .eq('member_user_id', sponsorUserId)
    .limit(1)
    .maybeSingle()

  if (error && !isWorkspaceSchemaMissing(error)) throw error
  return data?.depth ? data.depth + 1 : 1
}

export async function fetchWorkspaceContext(userId: string): Promise<WorkspaceContext> {
  try {
    const { data: membershipRow, error: membershipError } = await supabase
      .from('nmm_workspace_members')
      .select(`
        id,
        workspace_id,
        user_id,
        role,
        status,
        invited_by,
        joined_at,
        created_at,
        updated_at,
        workspace:nmm_workspaces(
          id,
          owner_user_id,
          name,
          slug,
          default_locale,
          country_code,
          is_personal,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle()

    if (membershipError) throw membershipError

    const membership = membershipRow as {
      id: string
      workspace_id: string
      user_id: string
      role: 'owner' | 'leader' | 'member' | 'assistant'
      status: 'invited' | 'active' | 'paused' | 'removed'
      invited_by: string | null
      joined_at: string
      created_at: string
      updated_at: string
      workspace: {
        id: string
        owner_user_id: string
        name: string
        slug: string
        default_locale: string
        country_code: string
        is_personal: boolean
        created_at: string
        updated_at: string
      } | null
    } | null

    if (!membership?.workspace) {
      return {
        mode: 'legacy',
        workspace: null,
        membership: null,
        memberCount: 0,
        schemaReady: true,
      }
    }

    const { count, error: countError } = await supabase
      .from('nmm_workspace_members')
      .select('id', { head: true, count: 'exact' })
      .eq('workspace_id', membership.workspace.id)
      .eq('status', 'active')

    if (countError) throw countError

    return {
      mode: 'workspace',
      workspace: membership.workspace,
      membership: {
        id: membership.id,
        workspace_id: membership.workspace_id,
        user_id: membership.user_id,
        role: membership.role,
        status: membership.status,
        invited_by: membership.invited_by,
        joined_at: membership.joined_at,
        created_at: membership.created_at,
        updated_at: membership.updated_at,
      },
      memberCount: count ?? 0,
      schemaReady: true,
    }
  } catch (error) {
    if (isWorkspaceSchemaMissing(error)) {
      return {
        mode: 'legacy',
        workspace: null,
        membership: null,
        memberCount: 0,
        schemaReady: false,
      }
    }

    throw error
  }
}

export async function bootstrapWorkspaceForCurrentUser() {
  const rpcClient = supabase as typeof supabase & {
    rpc: (
      fn: 'nmm_bootstrap_workspace_for_current_user'
    ) => Promise<{ data: string | null; error: { message?: string } | null }>
  }

  const { data, error } = await rpcClient.rpc('nmm_bootstrap_workspace_for_current_user')
  if (error) throw error
  return data
}

export async function fetchWorkspaceMembers(
  workspaceId: string,
  currentUserId: string,
  statuses: WorkspaceMember['status'][] = ['active']
): Promise<WorkspaceDirectoryMember[]> {
  try {
    let membershipQuery = supabase
      .from('nmm_workspace_members')
      .select('id, workspace_id, user_id, role, status, invited_by, joined_at, created_at, updated_at')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (statuses.length === 1) {
      membershipQuery = membershipQuery.eq('status', statuses[0])
    } else {
      membershipQuery = membershipQuery.in('status', statuses)
    }

    const { data: membershipRows, error: membershipError } = await membershipQuery

    if (membershipError) throw membershipError

    const memberships = (membershipRows ?? []) as MembershipRow[]
    if (memberships.length === 0) return []

    const userIds = memberships.map((membership) => membership.user_id)

    const [{ data: profileRows, error: profilesError }, { data: relationshipRows, error: relationshipsError }] = await Promise.all([
      supabase
        .from('nmm_profiles')
        .select('id, full_name, email, role, avatar_url, company')
        .in('id', userIds),
      supabase
        .from('nmm_member_relationships')
        .select('member_user_id, sponsor_user_id, depth')
        .eq('workspace_id', workspaceId),
    ])

    if (profilesError) throw profilesError
    if (relationshipsError && !isWorkspaceSchemaMissing(relationshipsError)) throw relationshipsError

    const relationships = (relationshipRows ?? []) as RelationshipRow[]
    const sponsorIds = relationships
      .map((row) => row.sponsor_user_id)
      .filter((value, index, array) => Boolean(value) && array.indexOf(value) === index)

    let sponsorProfilesById = new Map<string, ProfileRow>()

    if (sponsorIds.length > 0) {
      const { data: sponsorRows, error: sponsorError } = await supabase
        .from('nmm_profiles')
        .select('id, full_name, email, role, avatar_url, company')
        .in('id', sponsorIds)

      if (sponsorError) throw sponsorError
      sponsorProfilesById = new Map(((sponsorRows ?? []) as ProfileRow[]).map((profile) => [profile.id, profile]))
    }

    const profilesById = new Map(((profileRows ?? []) as ProfileRow[]).map((profile) => [profile.id, profile]))
    const relationshipsByMemberId = new Map(relationships.map((row) => [row.member_user_id, row]))

    return memberships.map((membership) => {
      const relationship = relationshipsByMemberId.get(membership.user_id)
      const sponsorProfile = relationship?.sponsor_user_id ? sponsorProfilesById.get(relationship.sponsor_user_id) : null

      return {
        membership,
        profile: profilesById.get(membership.user_id) ?? null,
        sponsorUserId: relationship?.sponsor_user_id ?? null,
        sponsorName: sponsorProfile?.full_name ?? sponsorProfile?.email ?? null,
        depth: relationship?.depth ?? null,
        isCurrentUser: membership.user_id === currentUserId,
      }
    })
  } catch (error) {
    if (isWorkspaceSchemaMissing(error)) return []
    throw error
  }
}

export async function searchWorkspaceInviteCandidates(
  workspaceId: string,
  query: string,
  currentUserId: string
): Promise<WorkspaceInviteCandidate[]> {
  const normalizedQuery = query.trim()
  if (normalizedQuery.length < 2) return []

  const { data: existingRows, error: existingError } = await supabase
    .from('nmm_workspace_members')
    .select('user_id')
    .eq('workspace_id', workspaceId)
    .neq('status', 'removed')

  if (existingError) throw existingError

  const excludedIds = new Set<string>([currentUserId, ...((existingRows ?? []).map((row) => row.user_id))])

  const { data, error } = await supabase
    .from('nmm_profiles')
    .select('id, full_name, email, role, company, avatar_url')
    .or(`full_name.ilike.%${normalizedQuery}%,email.ilike.%${normalizedQuery}%`)
    .order('full_name', { ascending: true })
    .limit(12)

  if (error) throw error

  return ((data ?? []) as WorkspaceInviteCandidate[])
    .filter((profile) => !excludedIds.has(profile.id))
    .slice(0, 8)
}

export async function updateWorkspaceMember(
  memberId: string,
  data: Partial<Pick<WorkspaceMember, 'role' | 'status'>>
) {
  const { data: updatedRow, error } = await supabase
    .from('nmm_workspace_members')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', memberId)
    .select('id, workspace_id, user_id, role, status, invited_by, joined_at, created_at, updated_at')
    .single()

  if (error) throw error
  return updatedRow as WorkspaceMember
}

export async function inviteWorkspaceMember({
  workspaceId,
  candidateUserId,
  invitedBy,
  role,
}: {
  workspaceId: string
  candidateUserId: string
  invitedBy: string
  role: WorkspaceMember['role']
}) {
  const now = new Date().toISOString()
  const depth = await resolveWorkspaceDepth(workspaceId, invitedBy)

  const { data: insertedMember, error: memberError } = await supabase
    .from('nmm_workspace_members')
    .insert({
      workspace_id: workspaceId,
      user_id: candidateUserId,
      role,
      status: 'invited',
      invited_by: invitedBy,
      joined_at: now,
      created_at: now,
      updated_at: now,
    })
    .select('id, workspace_id, user_id, role, status, invited_by, joined_at, created_at, updated_at')
    .single()

  if (memberError) throw memberError

  const { error: relationshipError } = await supabase
    .from('nmm_member_relationships')
    .upsert(
      {
        workspace_id: workspaceId,
        sponsor_user_id: invitedBy,
        member_user_id: candidateUserId,
        depth,
      },
      { onConflict: 'workspace_id,member_user_id' }
    )

  if (relationshipError && !isWorkspaceSchemaMissing(relationshipError)) {
    throw relationshipError
  }

  return insertedMember as WorkspaceMember
}

export async function updateWorkspaceRelationship({
  workspaceId,
  memberUserId,
  sponsorUserId,
}: {
  workspaceId: string
  memberUserId: string
  sponsorUserId: string
}) {
  const depth = await resolveWorkspaceDepth(workspaceId, sponsorUserId)

  const { data, error } = await supabase
    .from('nmm_member_relationships')
    .upsert(
      {
        workspace_id: workspaceId,
        member_user_id: memberUserId,
        sponsor_user_id: sponsorUserId,
        depth,
      },
      { onConflict: 'workspace_id,member_user_id' }
    )
    .select('id, workspace_id, sponsor_user_id, member_user_id, depth, created_at')
    .single()

  if (error) throw error
  return data as WorkspaceRelationship
}
