'use server'

import { createClient } from '@/lib/supabase/server'
import { isSuperAdmin } from '@/lib/domain/auth'
import {
  ONBOARDING_STEP_COUNT,
  parseLearningProgress,
  periodStartIso,
  type LearningProgressSummary,
  type PulsePeriod,
} from '@/lib/domain/pulse'
import { hasTeamPulseAccess } from '@/lib/domain/teamAccess'

export type MyPulseSummary = {
  learning: LearningProgressSummary
  onboardingDone: number
  field: {
    newCandidates: number
    calls: number
    whatsapps: number
  }
}

async function assertWorkspaceMember(workspaceId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Oturum gerekli.')

  const { data: membership } = await supabase
    .from('nmm_workspace_members')
    .select('workspace_id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (membership) return { supabase, user }

  const { data: ws } = await supabase
    .from('nmm_workspaces')
    .select('owner_id')
    .eq('id', workspaceId)
    .maybeSingle()

  if (ws?.owner_id === user.id) return { supabase, user }

  throw new Error('Bu workspace için yetkiniz yok.')
}

export async function getMyPulseSummaryAction(
  workspaceId: string,
  period: PulsePeriod
): Promise<MyPulseSummary> {
  const { supabase, user } = await assertWorkspaceMember(workspaceId)
  const since = periodStartIso(period)

  const { data: progress } = await supabase
    .from('nmm_user_progress')
    .select('read_trainings, fav_trainings, read_objections, fav_objections')
    .eq('user_id', user.id)
    .maybeSingle()

  const { count: onboardingDone } = await supabase
    .from('nmm_onboarding_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  let actionsQuery = supabase
    .from('nmm_daily_actions')
    .select('action_type')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)

  if (since) actionsQuery = actionsQuery.gte('created_at', since)

  const { data: actions } = await actionsQuery

  let candQuery = supabase
    .from('nmm_candidates')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .eq('owner_id', user.id)

  if (since) candQuery = candQuery.gte('created_at', since)

  const { count: newCandidates } = await candQuery

  const calls = actions?.filter(a => a.action_type === 'call').length ?? 0
  const whatsapps = actions?.filter(a => a.action_type === 'whatsapp').length ?? 0

  return {
    learning: parseLearningProgress(progress),
    onboardingDone: onboardingDone ?? 0,
    field: {
      newCandidates: newCandidates ?? 0,
      calls,
      whatsapps,
    },
  }
}

export type TeamProgressMap = Record<string, LearningProgressSummary>

export async function getTeamProgressMapAction(
  workspaceId: string,
  memberUserIds: string[]
): Promise<{ locked: boolean; progressByUserId: TeamProgressMap }> {
  const { supabase, user } = await assertWorkspaceMember(workspaceId)

  const { data: ws } = await supabase
    .from('nmm_workspaces')
    .select('license_type, owner_id')
    .eq('id', workspaceId)
    .single()

  const admin = isSuperAdmin(user)
  const locked = !hasTeamPulseAccess(ws?.license_type, admin)

  if (locked || memberUserIds.length === 0) {
    return { locked, progressByUserId: {} }
  }

  const uniqueIds = [...new Set(memberUserIds.filter(Boolean))]
  const { data: rows } = await supabase
    .from('nmm_user_progress')
    .select('user_id, read_trainings, fav_trainings, read_objections, fav_objections')
    .in('user_id', uniqueIds)

  const progressByUserId: TeamProgressMap = {}
  for (const row of rows ?? []) {
    progressByUserId[row.user_id] = parseLearningProgress(row)
  }

  return { locked: false, progressByUserId }
}

export { ONBOARDING_STEP_COUNT }
