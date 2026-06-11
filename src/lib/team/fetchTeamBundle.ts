import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { resolveCandidateFields } from '@/lib/domain/candidateFields'
import { findLeaderCandidateForMember } from '@/lib/team/matchCandidate'
import { fetchTeamWithDownlines } from '@/lib/team/fetchTeamWithDownlines'
import { enrichLeaderCandidates } from '@/lib/team/enrichLeaderCandidates'
import type { TeamMember } from '@/hooks/useTeamMembers'
import type { MemberRow } from '@/lib/team/types'
import { canonicalPartnerAvatarUrl } from '@/lib/team/partnerAvatarFix'

export interface TeamBundle {
  members: TeamMember[]
  ekipRows: MemberRow[]
}

type MemberMapEntry = {
  user_id: string
  full_name: string | null
  role: string
  joined_at: string | null
  avatar_url: string | null
}

function cleanStr(s: string | null | undefined) {
  return (s ?? '')
    .toLowerCase()
    .replace(/\u0131/g, 'i')
    .replace(/\u011f/g, 'g')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

async function resolveAuthAvatars(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
  userIds: string[]
): Promise<Record<string, string>> {
  if (!userIds.length) return {}

  const { data: ownWs } = await supabase
    .from('nmm_workspaces')
    .select('id, owner_id')
    .eq('id', workspaceId)
    .single()

  if (!ownWs) return {}

  const allowedIds = new Set<string>()
  if (ownWs.owner_id) allowedIds.add(ownWs.owner_id)
  const { data: wsMembers } = await supabase
    .from('nmm_workspace_members')
    .select('user_id')
    .eq('workspace_id', workspaceId)
  wsMembers?.forEach(m => allowedIds.add(m.user_id))

  // Downline keşfi kolon-kısıtlı definer rpc ile (055): nmm_workspaces SELECT politikası
  // own+member'a daraldı; davet kodu/lisans sızdırmadan id+owner_id alınır.
  const { data: downlineWs } = await supabase.rpc('nmm_leader_downline_workspaces')

  downlineWs?.forEach(w => {
    if (w.owner_id) allowedIds.add(w.owner_id)
  })

  const requested = userIds.filter(id => allowedIds.has(id))
  if (!requested.length) return {}

  const { data: avatarMap, error: rpcError } = await supabase.rpc('nmm_resolve_team_avatars', {
    p_workspace_id: workspaceId,
    p_user_ids: requested,
  })

  if (rpcError) {
    console.warn('[fetchTeamBundle] avatar rpc error:', rpcError.message)
    return {}
  }

  if (!avatarMap || typeof avatarMap !== 'object') return {}

  const result: Record<string, string> = {}
  for (const [userId, url] of Object.entries(avatarMap as Record<string, unknown>)) {
    if (typeof url === 'string' && url.trim()) result[userId] = url
  }
  return result
}

async function fetchPipelineLinks(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from('nmm_team_pipeline_links')
    .select('member_user_id, candidate_id')
    .eq('workspace_id', workspaceId)

  if (error) {
    console.warn('[fetchTeamBundle] pipeline links:', error.message)
    return {}
  }

  const map: Record<string, string> = {}
  for (const row of data ?? []) {
    map[row.member_user_id] = row.candidate_id
  }
  return map
}

async function fetchPipelineMatchBlocks(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('nmm_team_pipeline_match_blocks')
    .select('member_user_id')
    .eq('workspace_id', workspaceId)

  if (error) {
    console.warn('[fetchTeamBundle] pipeline match blocks:', error.message)
    return new Set()
  }

  return new Set((data ?? []).map(row => row.member_user_id))
}

/** Tek RPC / legacy turunda istatistik + ekip paneli verisi. */
export async function fetchTeamBundle(
  supabase: SupabaseClient<Database>,
  workspaceId: string
): Promise<TeamBundle> {
  const rpcBundle = await fetchTeamWithDownlines(supabase, workspaceId)
  if (rpcBundle) {
    const { leaderOwnerId } = rpcBundle
    const members = rpcBundle.members
    members.forEach(m => {
      m.role = m.user_id === leaderOwnerId ? 'leader' : 'member'
    })
    const allUserIds = members.map(m => m.user_id)
    const authAvatars = await resolveAuthAvatars(supabase, workspaceId, allUserIds)
    const candidates = await enrichLeaderCandidates(supabase, rpcBundle.leaderCandidates)
    const pipelineLinks = await fetchPipelineLinks(supabase, workspaceId)
    const matchBlocks = await fetchPipelineMatchBlocks(supabase, workspaceId)
    const ownWs = { owner_id: leaderOwnerId }

    const registeredMemberRows: MemberRow[] = members.map(m => {
      const mc = candidates.filter(c => c.owner_id === m.user_id)
      const linkedId = pipelineLinks[m.user_id] ?? null
      const fuzzyId = !linkedId && !matchBlocks.has(m.user_id) && ownWs.owner_id
        ? findLeaderCandidateForMember(candidates, ownWs.owner_id, m.full_name)
        : null
      const matchedPipelineId = linkedId ?? fuzzyId
      const candidateMatch = matchedPipelineId
        ? candidates.find(c => c.id === matchedPipelineId)
        : undefined
      const phone = candidateMatch?.phone ?? null
      const noteAvatar = candidateMatch ? resolveCandidateFields(candidateMatch).avatarUrl ?? '' : ''
      const resolvedAvatar = canonicalPartnerAvatarUrl(
        m.user_id,
        m.avatar_url ?? authAvatars[m.user_id] ?? (noteAvatar || null),
      )

      // Propagate resolved avatar to the source member object for statistics views
      m.avatar_url = resolvedAvatar

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
        pipeline_link_explicit: linkedId != null,
      }
    })

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
            const mWords = (m.full_name ?? '')
              .split(/\s+/)
              .map(w => cleanStr(w))
              .filter(w => w.length >= 3)
            return mWords.some(w => cf.includes(w))
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

    const ekipRows = [...registeredMemberRows, ...nonAppMembers].sort((a, b) => {
      if (a.role === 'leader') return -1
      if (b.role === 'leader') return 1
      if (a.isAppUser && !b.isAppUser) return -1
      if (!a.isAppUser && b.isAppUser) return 1
      return b.candidate_count - a.candidate_count
    })

    return { members, ekipRows }
  }

  return fetchTeamBundleLegacy(supabase, workspaceId)
}

async function fetchTeamBundleLegacy(
  supabase: SupabaseClient<Database>,
  workspaceId: string
): Promise<TeamBundle> {
  const { data: ownWs, error: wsErr } = await supabase
    .from('nmm_workspaces')
    .select('id, owner_id')
    .eq('id', workspaceId)
    .single()

  if (wsErr || !ownWs) throw new Error(wsErr?.message || 'Workspace not found')

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { data: membersRaw, error } = await supabase
    .from('nmm_workspace_members')
    .select('user_id, full_name, role, joined_at, avatar_url')
    .eq('workspace_id', workspaceId)

  if (error) throw error
  const membersList = membersRaw ?? []

  const uniqueMembersMap: Record<string, MemberMapEntry> = {}
  if (ownWs.owner_id) {
    const leaderRow = membersList.find(m => m.user_id === ownWs.owner_id)
    uniqueMembersMap[ownWs.owner_id] = {
      user_id: ownWs.owner_id,
      full_name: leaderRow?.full_name ?? 'Lider',
      role: 'leader',
      joined_at: leaderRow?.joined_at ?? new Date().toISOString(),
      avatar_url: leaderRow?.avatar_url ?? null,
    }
  }
  membersList.forEach(m => {
    uniqueMembersMap[m.user_id] = m
  })

  const { data: downlineWs } = await supabase.rpc('nmm_leader_downline_workspaces')

  const downlineWsIds = downlineWs?.map(w => w.id) ?? []
  const downlineOwnerIds = (downlineWs?.map(w => w.owner_id).filter(Boolean) ?? []) as string[]

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

  const finalAllUserIds = Object.keys(uniqueMembersMap)
  const avatarByUser: Record<string, string> = {}
  if (finalAllUserIds.length > 0) {
    const { data: avatarRows } = await supabase
      .from('nmm_workspace_members')
      .select('user_id, avatar_url')
      .in('user_id', finalAllUserIds)
      .not('avatar_url', 'is', null)
    avatarRows?.forEach(row => {
      if (row.avatar_url) avatarByUser[row.user_id] = row.avatar_url
    })
  }

  const finalUniqueMembers = Object.values(uniqueMembersMap)
  const allWorkspaceIds = [workspaceId, ...downlineWsIds]

  const [
    { data: candidatesRaw },
    { data: recentActions },
    { data: onboardingRaw },
    { data: todayActionsRaw },
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
    supabase.from('nmm_onboarding_progress').select('user_id, step_id').in('user_id', finalAllUserIds),
    supabase
      .from('nmm_daily_actions')
      .select('user_id, note')
      .in('user_id', finalAllUserIds)
      .eq('action_type', 'ai_generate')
      .gte('created_at', todayStart.toISOString()),
  ])

  const candidates = candidatesRaw ?? []
  const actions = recentActions ?? []
  const onboarding = onboardingRaw ?? []
  const todayActions = todayActionsRaw ?? []

  const lastActionMap: Record<string, string> = {}
  finalUniqueMembers.forEach(m => {
    if (m.joined_at) lastActionMap[m.user_id] = m.joined_at
  })
  actions.forEach(act => {
    const cur = lastActionMap[act.user_id]
    if (!cur || new Date(act.created_at) > new Date(cur)) lastActionMap[act.user_id] = act.created_at
  })

  const authAvatars = await resolveAuthAvatars(supabase, workspaceId, finalAllUserIds)

  const statsMembers: TeamMember[] = finalUniqueMembers
    .map(m => {
      const mc = candidates.filter(c => c.owner_id === m.user_id)
      const completedSteps = onboarding.filter(o => o.user_id === m.user_id).map(o => o.step_id)
      const memberTodayActions = todayActions.filter(act => act.user_id === m.user_id)
      let todayRoleplay = 0
      let todayCompliance = 0
      let todayMessage = 0
      memberTodayActions.forEach(act => {
        if (act.note === 'roleplay') todayRoleplay++
        else if (act.note === 'compliance') todayCompliance++
        else todayMessage++
      })

      const linkedId = pipelineLinks[m.user_id] ?? null
      const fuzzyId = !linkedId && !matchBlocks.has(m.user_id) && ownWs.owner_id
        ? findLeaderCandidateForMember(candidates, ownWs.owner_id, m.full_name)
        : null
      const matchedPipelineId = linkedId ?? fuzzyId
      const candidateMatch = matchedPipelineId ? candidates.find(c => c.id === matchedPipelineId) : undefined
      const noteAvatar = candidateMatch ? resolveCandidateFields(candidateMatch).avatarUrl ?? '' : ''
      const resolvedAvatar = canonicalPartnerAvatarUrl(
        m.user_id,
        m.avatar_url ?? avatarByUser[m.user_id] ?? authAvatars[m.user_id] ?? (noteAvatar || null),
      )

      return {
        user_id: m.user_id,
        full_name: m.full_name,
        role: (m.user_id === ownWs.owner_id ? 'leader' : 'member') as 'leader' | 'member',
        joined_at: m.joined_at ?? null,
        candidate_count: mc.length,
        yeni_count: mc.filter(c => c.stage === 'yeni').length,
        iletisim_count: mc.filter(c => c.stage === 'iletisim').length,
        davetli_count: mc.filter(c => c.stage === 'davetli').length,
        sunum_count: mc.filter(c => c.stage === 'sunum').length,
        takip_count: mc.filter(c => c.stage === 'takip').length,
        katildi_count: mc.filter(c => c.stage === 'katildi').length,
        last_activity_at: lastActionMap[m.user_id] ?? null,
        onboarding_steps: completedSteps,
        today_roleplay: todayRoleplay,
        today_compliance: todayCompliance,
        today_message: todayMessage,
        avatar_url: resolvedAvatar,
      }
    })
    .sort((a, b) => b.candidate_count - a.candidate_count)

  const pipelineLinks = await fetchPipelineLinks(supabase, workspaceId)
  const matchBlocks = await fetchPipelineMatchBlocks(supabase, workspaceId)

  const registeredMemberRows: MemberRow[] = finalUniqueMembers.map(m => {
    const mc = candidates.filter(c => c.owner_id === m.user_id)
    const completedSteps = onboarding.filter(o => o.user_id === m.user_id).map(o => o.step_id)
    const linkedId = pipelineLinks[m.user_id] ?? null
    const fuzzyId = !linkedId && !matchBlocks.has(m.user_id) && ownWs.owner_id
      ? findLeaderCandidateForMember(candidates, ownWs.owner_id, m.full_name)
      : null
    const matchedPipelineId = linkedId ?? fuzzyId
    const candidateMatch = matchedPipelineId ? candidates.find(c => c.id === matchedPipelineId) : undefined
    const phone = candidateMatch?.phone ?? null
    const noteAvatar = candidateMatch ? resolveCandidateFields(candidateMatch).avatarUrl ?? '' : ''
    const resolvedAvatar = canonicalPartnerAvatarUrl(
      m.user_id,
      m.avatar_url ?? avatarByUser[m.user_id] ?? authAvatars[m.user_id] ?? (noteAvatar || null),
    )

    return {
      user_id: m.user_id,
      full_name: m.full_name,
      role: (m.user_id === ownWs.owner_id ? 'leader' : 'member') as 'leader' | 'member',
      joined_at: m.joined_at ?? null,
      candidate_count: mc.length,
      yeni_count: mc.filter(c => c.stage === 'yeni').length,
      sunum_count: mc.filter(c => c.stage === 'sunum').length,
      takip_count: mc.filter(c => c.stage === 'takip').length,
      katildi_count: mc.filter(c => c.stage === 'katildi').length,
      last_activity_at: lastActionMap[m.user_id] ?? null,
      onboarding_steps: completedSteps,
      phone,
      isAppUser: true,
      avatar_url: resolvedAvatar,
      pipeline_id: candidateMatch?.id ?? null,
      pipeline_link_explicit: linkedId != null,
    }
  })

  const nonAppMembers: MemberRow[] = []
  candidates
    .filter(c => c.owner_id === ownWs.owner_id && c.stage === 'katildi')
    .forEach(c => {
      const isMatched = registeredMemberRows.some(m => {
        const mf = cleanStr(m.full_name)
        const cf = cleanStr(c.full_name)
        if (!mf || !cf) return false
        if (mf.includes(cf) || cf.includes(mf)) return true
        const mWords = (m.full_name ?? '')
          .split(/\s+/)
          .map(w => cleanStr(w))
          .filter(w => w.length >= 3)
        return mWords.some(w => cf.includes(w))
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

  const ekipRows = [...registeredMemberRows, ...nonAppMembers].sort((a, b) => {
    if (a.role === 'leader') return -1
    if (b.role === 'leader') return 1
    if (a.isAppUser && !b.isAppUser) return -1
    if (!a.isAppUser && b.isAppUser) return 1
    return b.candidate_count - a.candidate_count
  })

  return { members: statsMembers, ekipRows }
}
