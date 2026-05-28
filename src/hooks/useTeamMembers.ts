'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { fetchTeamWithDownlines } from '@/lib/team/fetchTeamWithDownlines'

export interface TeamMember {
  user_id: string
  full_name: string | null
  role: 'leader' | 'member'
  joined_at: string | null
  candidate_count: number
  yeni_count: number
  iletisim_count: number
  davetli_count: number
  sunum_count: number
  takip_count: number
  katildi_count: number
  last_activity_at: string | null
  onboarding_steps?: string[]
  today_roleplay?: number
  today_compliance?: number
  today_message?: number
  avatar_url?: string | null
}

async function fetchTeamMembersLegacy(workspaceId: string): Promise<TeamMember[]> {
  const supabase = createClient()

  // 1. Get the workspace owner_id
  const { data: ownWs, error: wsErr } = await supabase
    .from('nmm_workspaces')
    .select('id, owner_id')
    .eq('id', workspaceId)
    .single()

  if (wsErr || !ownWs) throw new Error(wsErr?.message || 'Workspace not found')

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  // 2. Get all members in this workspace — nmm_join_workspace RPC adds downlines here
  const { data: members, error } = await supabase
    .from('nmm_workspace_members')
    .select('user_id, full_name, role, joined_at, avatar_url')
    .eq('workspace_id', workspaceId)

  if (error) throw error

  // Build deduped members map (leader always present)
  const uniqueMembersMap: Record<string, { user_id: string; full_name: string | null; role: string; joined_at: string | null; avatar_url: string | null }> = {}
  if (ownWs.owner_id) {
    const leaderRow = members?.find(m => m.user_id === ownWs.owner_id)
    uniqueMembersMap[ownWs.owner_id] = {
      user_id: ownWs.owner_id,
      full_name: leaderRow?.full_name ?? 'Lider',
      role: 'leader',
      joined_at: leaderRow?.joined_at ?? new Date().toISOString(),
      avatar_url: leaderRow?.avatar_url ?? null
    }
  }
  members?.forEach(m => { uniqueMembersMap[m.user_id] = m })

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

  // 4. Parallel fetches
  const [
    { data: candidatesRaw },
    { data: recentActions },
    { data: onboardingRaw },
    { data: todayActionsRaw },
  ] = await Promise.all([
    supabase.from('nmm_candidates').select('owner_id, stage').in('workspace_id', allWorkspaceIds),
    supabase.from('nmm_daily_actions').select('user_id, created_at').in('workspace_id', allWorkspaceIds)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from('nmm_onboarding_progress').select('user_id, step_id').in('user_id', finalAllUserIds),
    supabase.from('nmm_daily_actions').select('user_id, note').in('user_id', finalAllUserIds)
      .eq('action_type', 'ai_generate').gte('created_at', todayStart.toISOString()),
  ])

  const candidates = candidatesRaw ?? []
  const actions = recentActions ?? []
  const onboarding = onboardingRaw ?? []
  const todayActions = todayActionsRaw ?? []

  const lastActionMap: Record<string, string> = {}
  finalUniqueMembers.forEach(m => { if (m.joined_at) lastActionMap[m.user_id] = m.joined_at })
  actions.forEach(act => {
    const cur = lastActionMap[act.user_id]
    if (!cur || new Date(act.created_at) > new Date(cur)) lastActionMap[act.user_id] = act.created_at
  })

  return finalUniqueMembers
    .map(m => {
      const mc = candidates.filter(c => c.owner_id === m.user_id)
      const completedSteps = onboarding.filter(o => o.user_id === m.user_id).map(o => o.step_id)

      const memberTodayActions = todayActions.filter(act => act.user_id === m.user_id)
      let todayRoleplay = 0, todayCompliance = 0, todayMessage = 0
      memberTodayActions.forEach(act => {
        if (act.note === 'roleplay') todayRoleplay++
        else if (act.note === 'compliance') todayCompliance++
        else todayMessage++
      })

      return {
        user_id: m.user_id,
        full_name: m.full_name,
        role: (m.user_id === ownWs.owner_id ? 'leader' : 'member') as 'leader' | 'member',
        joined_at: m.joined_at ?? null,
        candidate_count: mc.length,
        yeni_count:      mc.filter(c => c.stage === 'yeni').length,
        iletisim_count:  mc.filter(c => c.stage === 'iletisim').length,
        davetli_count:   mc.filter(c => c.stage === 'davetli').length,
        sunum_count:     mc.filter(c => c.stage === 'sunum').length,
        takip_count:     mc.filter(c => c.stage === 'takip').length,
        katildi_count:   mc.filter(c => c.stage === 'katildi').length,
        last_activity_at: lastActionMap[m.user_id] ?? null,
        onboarding_steps: completedSteps,
        today_roleplay: todayRoleplay,
        today_compliance: todayCompliance,
        today_message: todayMessage,
        avatar_url: m.avatar_url ?? avatarByUser[m.user_id] ?? null,
      }
    })
    .sort((a, b) => b.candidate_count - a.candidate_count)
}

async function fetchTeamMembers(workspaceId: string): Promise<TeamMember[]> {
  const supabase = createClient()
  const bundle = await fetchTeamWithDownlines(supabase, workspaceId)
  if (bundle) return bundle.members
  return fetchTeamMembersLegacy(workspaceId)
}

export function useTeamMembers(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['members', workspaceId],
    queryFn: () => fetchTeamMembers(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 2 * 60 * 1000,
  })
}
