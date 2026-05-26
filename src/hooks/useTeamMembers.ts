'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

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
}

async function fetchTeamMembers(workspaceId: string): Promise<TeamMember[]> {
  const supabase = createClient()

  // 1. Get the workspace owner_id
  const { data: ownWs, error: wsErr } = await supabase
    .from('nmm_workspaces')
    .select('id, owner_id')
    .eq('id', workspaceId)
    .single()

  if (wsErr || !ownWs) throw new Error(wsErr?.message || 'Workspace not found')

  // 2. Fetch all direct downlines who have set their parent_id to this leader's owner_id
  const { data: downlines } = await supabase
    .from('nmm_workspaces')
    .select('id, owner_id')
    .eq('parent_id' as any, ownWs.owner_id)

  const downlineUserIds = (downlines?.map(d => d.owner_id).filter(Boolean) as string[]) || []
  const downlineWsIds = (downlines?.map(d => d.id).filter(Boolean) as string[]) || []

  // Combine workspace IDs and owner user IDs (own workspace + downlines)
  const allWorkspaceIds = [workspaceId, ...downlineWsIds]
  const allUserIds = [ownWs.owner_id, ...downlineUserIds].filter(Boolean) as string[]

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [
    { data: members, error },
    { data: candidatesRaw },
    { data: recentActions },
    { data: onboardingRaw },
    { data: todayActionsRaw }
  ] = await Promise.all([
    supabase
      .from('nmm_workspace_members')
      .select('user_id, full_name, role, joined_at')
      .in('user_id', allUserIds),
    supabase
      .from('nmm_candidates')
      .select('owner_id, stage')
      .in('workspace_id', allWorkspaceIds),
    supabase
      .from('nmm_daily_actions')
      .select('user_id, created_at')
      .in('workspace_id', allWorkspaceIds)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from('nmm_onboarding_progress' as any)
      .select('user_id, step_id')
      .in('user_id', allUserIds),
    supabase
      .from('nmm_daily_actions')
      .select('user_id, note')
      .in('user_id', allUserIds)
      .eq('action_type', 'ai_generate')
      .gte('created_at', todayStart.toISOString())
  ])

  if (error) throw error
  const candidates = candidatesRaw ?? []
  const actions = recentActions ?? []
  const onboarding = onboardingRaw ?? []
  const todayActions = todayActionsRaw ?? []

  // Create clean map of members to remove duplicates
  const uniqueMembersMap: Record<string, typeof members[0]> = {}
  if (ownWs.owner_id) {
    uniqueMembersMap[ownWs.owner_id] = {
      user_id: ownWs.owner_id,
      full_name: members?.find(m => m.user_id === ownWs.owner_id)?.full_name ?? 'Lider',
      role: 'leader',
      joined_at: members?.find(m => m.user_id === ownWs.owner_id)?.joined_at ?? new Date().toISOString()
    }
  }
  members?.forEach(m => {
    uniqueMembersMap[m.user_id] = m
  })
  const uniqueMembers = Object.values(uniqueMembersMap)

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

  return uniqueMembers
    .map(m => {
      const mc = candidates.filter(c => c.owner_id === m.user_id)
      const completedSteps = onboarding
        .filter((o: any) => o.user_id === m.user_id)
        .map((o: any) => o.step_id)

      const memberTodayActions = todayActions.filter(act => act.user_id === m.user_id)
      let todayRoleplay = 0
      let todayCompliance = 0
      let todayMessage = 0

      memberTodayActions.forEach(act => {
        if (act.note === 'roleplay') {
          todayRoleplay++
        } else if (act.note === 'compliance') {
          todayCompliance++
        } else {
          todayMessage++
        }
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
      }
    })
    .sort((a, b) => b.candidate_count - a.candidate_count)
}

export function useTeamMembers(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['members', workspaceId],
    queryFn: () => fetchTeamMembers(workspaceId!),
    enabled: !!workspaceId,
  })
}
