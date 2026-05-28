import { createClient } from '@/lib/supabase/client'
import { resolveCandidateFields } from '@/lib/domain/candidateFields'
import { findLeaderCandidateForMember } from '@/lib/team/matchCandidate'
import { fetchTeamWithDownlines } from '@/lib/team/fetchTeamWithDownlines'
import { resolveTeamAvatarsAction } from '@/app/(dashboard)/ekip/actions'
import type { MemberRow } from '@/lib/team/types'
import { enrichLeaderCandidates } from '@/lib/team/enrichLeaderCandidates'

/**
 * Builds the Ekibim team list (leader + downlines + field distributors).
 * Prefers the single-roundtrip RPC bundle; falls back to the legacy multi-query
 * path when the RPC is unavailable. Behaviour is identical to the previous
 * in-component fetchMembers implementation.
 */
export async function fetchEkipMembers(workspaceId: string): Promise<MemberRow[]> {
  const supabase = createClient()

  const rpcBundle = await fetchTeamWithDownlines(supabase, workspaceId)
  if (rpcBundle) {
    const allUserIds = rpcBundle.members.map(m => m.user_id)
    const authAvatars = await resolveTeamAvatarsAction(workspaceId, allUserIds)
    const candidates = await enrichLeaderCandidates(supabase, rpcBundle.leaderCandidates)
    const { members, leaderOwnerId } = rpcBundle
    const ownWs = { owner_id: leaderOwnerId }

    const registeredMemberRows = members.map(m => {
      const mc = candidates.filter(c => c.owner_id === m.user_id)
      const matchedPipelineId = ownWs.owner_id
        ? findLeaderCandidateForMember(candidates, ownWs.owner_id, m.full_name)
        : null
      const candidateMatch = matchedPipelineId
        ? candidates.find(c => c.id === matchedPipelineId)
        : undefined
      const phone = candidateMatch?.phone ?? null
      const noteAvatar = candidateMatch ? resolveCandidateFields(candidateMatch).avatarUrl ?? '' : ''
      const resolvedAvatar = m.avatar_url ?? authAvatars[m.user_id] ?? (noteAvatar || null)

      return {
        user_id: m.user_id,
        full_name: m.full_name,
        role: m.role,
        joined_at: m.joined_at,
        candidate_count: mc.length || m.candidate_count,
        yeni_count: m.yeni_count,
        sunum_count: m.sunum_count,
        takip_count: m.takip_count,
        katildi_count: m.katildi_count,
        last_activity_at: m.last_activity_at,
        onboarding_steps: m.onboarding_steps,
        phone,
        isAppUser: true as const,
        avatar_url: resolvedAvatar,
        pipeline_id: matchedPipelineId,
      }
    })

    const cleanStr = (s: string | null | undefined) => (s ?? '')
      .toLowerCase()
      .replace(/\u0131/g, 'i').replace(/\u011f/g, 'g')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')

    const nonAppMembers: MemberRow[] = []
    if (ownWs.owner_id) {
      candidates
        .filter(c => c.owner_id === ownWs.owner_id && c.stage === 'katildi')
        .forEach(c => {
          const isMatched = registeredMemberRows.some(m => {
            const mf = cleanStr(m.full_name)
            const cf = cleanStr(c.full_name)
            if (!mf || !cf) return false
            if (mf.includes(cf) || cf.includes(mf)) return true
            const mWords = (m.full_name ?? '').split(/\s+/).map((w: string) => cleanStr(w)).filter((w: string) => w.length >= 3)
            return mWords.some((w: string) => cf.includes(w))
          })
          if (!isMatched) {
            const parsedNote = resolveCandidateFields(c)
            nonAppMembers.push({
              user_id: c.id,
              full_name: c.full_name,
              role: 'member',
              joined_at: c.created_at || null,
              candidate_count: 0,
              yeni_count: 0,
              sunum_count: 0,
              takip_count: 0,
              katildi_count: 0,
              last_activity_at: null,
              onboarding_steps: [],
              phone: c.phone || null,
              isAppUser: false,
              avatar_url: parsedNote.avatarUrl || null,
              pipeline_id: c.id,
            })
          }
        })
    }

    return [...registeredMemberRows, ...nonAppMembers].sort((a, b) => {
      if (a.role === 'leader') return -1
      if (b.role === 'leader') return 1
      if (a.isAppUser && !b.isAppUser) return -1
      if (!a.isAppUser && b.isAppUser) return 1
      return b.candidate_count - a.candidate_count
    })
  }

  // 1. Get the workspace owner_id
  const { data: ownWs, error: wsErr } = await supabase
    .from('nmm_workspaces')
    .select('id, owner_id')
    .eq('id', workspaceId)
    .single()

  if (wsErr || !ownWs) throw new Error(wsErr?.message || 'Workspace not found')

  // 2. Get all members in this workspace — nmm_join_workspace RPC adds downlines here
  const { data: membersRaw, error } = await supabase
    .from('nmm_workspace_members')
    .select('user_id, full_name, role, joined_at, avatar_url')
    .eq('workspace_id', workspaceId)

  if (error) throw error
  const members = membersRaw ?? []

  // Build deduped members map (leader always present)
  type MemberMapEntry = {
    user_id: string
    full_name: string | null
    role: string
    joined_at: string | null
    avatar_url: string | null
  }
  const uniqueMembersMap: Record<string, MemberMapEntry> = {}
  if (ownWs.owner_id) {
    const leaderRow = members.find(m => m.user_id === ownWs.owner_id)
    uniqueMembersMap[ownWs.owner_id] = {
      user_id: ownWs.owner_id,
      full_name: leaderRow?.full_name ?? 'Lider',
      role: 'leader',
      joined_at: leaderRow?.joined_at ?? new Date().toISOString(),
      avatar_url: leaderRow?.avatar_url ?? null
    }
  }
  members.forEach(m => { uniqueMembersMap[m.user_id] = m })

  // 3. Find all downline workspaces that have parent_id = leader's workspaceId
  // Also support legacy where parent_id = leader's owner_id
  const { data: downlineWs } = await supabase
    .from('nmm_workspaces')
    .select('id, owner_id')
    .or(`parent_id.eq.${workspaceId},parent_id.eq.${ownWs.owner_id}`)

  const downlineWsIds = downlineWs?.map(w => w.id) ?? []
  const downlineOwnerIds = (downlineWs?.map(w => w.owner_id).filter(Boolean) ?? []) as string[]

  // Add the downline owners to uniqueMembers if they aren't there yet
  if (downlineOwnerIds.length > 0) {
    const { data: dlMembers } = await supabase
      .from('nmm_workspace_members')
      .select('user_id, full_name, role, joined_at, avatar_url')
      .in('user_id', downlineOwnerIds)

    dlMembers?.forEach(m => {
      const existing = uniqueMembersMap[m.user_id]
      if (!existing) {
        uniqueMembersMap[m.user_id] = m
      } else if (!existing.avatar_url && m.avatar_url) {
        uniqueMembersMap[m.user_id] = { ...existing, avatar_url: m.avatar_url }
      }
    })
  }

  const allUserIds = Object.keys(uniqueMembersMap)

  // Avatar may live on the member's own workspace row while sponsor workspace has null
  const avatarByUser: Record<string, string> = {}
  if (allUserIds.length > 0) {
    const { data: avatarRows } = await supabase
      .from('nmm_workspace_members')
      .select('user_id, avatar_url')
      .in('user_id', allUserIds)
      .not('avatar_url', 'is', null)
    avatarRows?.forEach(row => {
      if (row.avatar_url) avatarByUser[row.user_id] = row.avatar_url
    })
  }
  const uniqueMembers = Object.values(uniqueMembersMap)
  const allWorkspaceIds = [workspaceId, ...downlineWsIds]

  const [
    { data: candidatesRaw },
    { data: recentActions },
    { data: onboardingRaw }
  ] = await Promise.all([
    supabase
      .from('nmm_candidates')
      .select('id, owner_id, stage, full_name, phone, created_at, note, note_tr, note_en, avatar_url, warmth')
      .in('workspace_id', allWorkspaceIds),
    supabase
      .from('nmm_daily_actions')
      .select('user_id, created_at')
      .in('workspace_id', allWorkspaceIds)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from('nmm_onboarding_progress')
      .select('user_id, step_id')
      .in('user_id', allUserIds)
  ])

  const candidates = candidatesRaw ?? []
  const actions = recentActions ?? []
  const onboarding = onboardingRaw ?? []

  const lastActionMap: Record<string, string> = {}
  uniqueMembers.forEach(m => {
    if (m.joined_at) {
      lastActionMap[m.user_id] = m.joined_at
    }
  })
  actions.forEach(act => {
    const current = lastActionMap[act.user_id]
    if (!current || new Date(act.created_at) > new Date(current)) {
      lastActionMap[act.user_id] = act.created_at
    }
  })

  const cleanStr = (s: string | null | undefined) => (s ?? '')
    .toLowerCase()
    .replace(/\u0131/g, 'i').replace(/\u011f/g, 'g')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')

  const authAvatars = await resolveTeamAvatarsAction(workspaceId, allUserIds)

  // 1. Map registered NMM App users
  const registeredMemberRows = uniqueMembers.map(m => {
    const mc = candidates.filter(c => c.owner_id === m.user_id)
    const completedSteps = onboarding
      .filter(o => o.user_id === m.user_id)
      .map(o => o.step_id)

    const matchedPipelineId = ownWs.owner_id
      ? findLeaderCandidateForMember(candidates, ownWs.owner_id, m.full_name)
      : null
    const candidateMatch = matchedPipelineId
      ? candidates.find(c => c.id === matchedPipelineId)
      : undefined
    const phone = candidateMatch?.phone ?? null
    const noteAvatar = candidateMatch ? resolveCandidateFields(candidateMatch).avatarUrl ?? '' : ''
    const resolvedAvatar = m.avatar_url ?? avatarByUser[m.user_id] ?? authAvatars[m.user_id] ?? (noteAvatar || null)

    return {
      user_id: m.user_id,
      full_name: m.full_name,
      role: (m.user_id === ownWs.owner_id ? 'leader' : 'member') as 'leader' | 'member',
      joined_at: m.joined_at ?? null,
      candidate_count: mc.length,
      yeni_count:    mc.filter(c => c.stage === 'yeni').length,
      sunum_count:   mc.filter(c => c.stage === 'sunum').length,
      takip_count:   mc.filter(c => c.stage === 'takip').length,
      katildi_count: mc.filter(c => c.stage === 'katildi').length,
      last_activity_at: lastActionMap[m.user_id] ?? null,
      onboarding_steps: completedSteps,
      phone: phone,
      isAppUser: true,
      avatar_url: resolvedAvatar,
      pipeline_id: candidateMatch?.id ?? null,
    }
  })

  // 2. Find all candidates of the leader where stage is 'katildi' ( MLM joined )
  const leaderWonCandidates = candidates.filter(c =>
    c.owner_id === ownWs.owner_id &&
    c.stage === 'katildi'
  )

  // 3. For each won candidate, if not matched with an active NMM member, add as Saha Distribütörü
  const nonAppMembers: MemberRow[] = []
  leaderWonCandidates.forEach(c => {
    const isMatched = registeredMemberRows.some(m => {
      const mf = cleanStr(m.full_name)
      const cf = cleanStr(c.full_name)
      if (!mf || !cf) return false
      if (mf.includes(cf) || cf.includes(mf)) return true
      // Token fallback: any word (≥3 chars) from the workspace member name found in the candidate name
      const mWords = (m.full_name ?? '').split(/\s+/).map((w: string) => cleanStr(w)).filter((w: string) => w.length >= 3)
      return mWords.some((w: string) => cf.includes(w))
    })

    if (!isMatched) {
      const parsedNote = resolveCandidateFields(c)
      nonAppMembers.push({
        user_id: c.id,
        full_name: c.full_name,
        role: 'member',
        joined_at: c.created_at || null,
        candidate_count: 0,
        yeni_count: 0,
        sunum_count: 0,
        takip_count: 0,
        katildi_count: 0,
        last_activity_at: null,
        onboarding_steps: [],
        phone: c.phone || null,
        isAppUser: false,
        avatar_url: parsedNote.avatarUrl || null,
        pipeline_id: c.id,
      })
    }
  })

  // 4. Combine and sort
  const combined = [...registeredMemberRows, ...nonAppMembers]

  return combined.sort((a, b) => {
    if (a.role === 'leader') return -1
    if (b.role === 'leader') return 1

    // NMM App Users come before Field Partners
    if (a.isAppUser && !b.isAppUser) return -1
    if (!a.isAppUser && b.isAppUser) return 1

    return b.candidate_count - a.candidate_count
  })
}
