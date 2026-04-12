import { supabase } from '@/lib/supabase'
import type { Profile, WorkspaceContext, WorkspaceDirectoryMember, WorkspaceMember, WorkspaceRelationship } from '@/lib/workspace/types'

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
    }
  } catch (error) {
    if (isWorkspaceSchemaMissing(error)) {
      return {
        mode: 'legacy',
        workspace: null,
        membership: null,
        memberCount: 0,
      }
    }

    throw error
  }
}

export async function fetchWorkspaceMembers(workspaceId: string, currentUserId: string): Promise<WorkspaceDirectoryMember[]> {
  try {
    const { data: membershipRows, error: membershipError } = await supabase
      .from('nmm_workspace_members')
      .select('id, workspace_id, user_id, role, status, invited_by, joined_at, created_at, updated_at')
      .eq('workspace_id', workspaceId)
      .eq('status', 'active')
      .order('joined_at', { ascending: true })

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

    const profilesById = new Map(((profileRows ?? []) as ProfileRow[]).map((profile) => [profile.id, profile]))
    const relationshipsByMemberId = new Map(((relationshipRows ?? []) as RelationshipRow[]).map((row) => [row.member_user_id, row]))

    return memberships.map((membership) => {
      const relationship = relationshipsByMemberId.get(membership.user_id)

      return {
        membership,
        profile: profilesById.get(membership.user_id) ?? null,
        sponsorUserId: relationship?.sponsor_user_id ?? null,
        depth: relationship?.depth ?? null,
        isCurrentUser: membership.user_id === currentUserId,
      }
    })
  } catch (error) {
    if (isWorkspaceSchemaMissing(error)) return []
    throw error
  }
}
