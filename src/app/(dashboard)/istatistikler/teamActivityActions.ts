'use server'

import { createClient } from '@/lib/supabase/server'
import { hasTeamPageAccess, hasTeamPulseAccess } from '@/lib/domain/teamAccess'
import { isSuperAdmin } from '@/lib/domain/auth'
import { periodStartIso, parseLearningProgress, type PulsePeriod, type SheetActivityPeriod } from '@/lib/domain/pulse'
import { getTeamVideoSummaryMapAction } from '@/app/(dashboard)/egitim/videoActions'

export type TeamMemberFieldActivity = {
  userId: string
  calls: number
  whatsapps: number
  newCandidates: number
  activeDays: number
}

export type TeamFieldActivityResult = {
  totals: {
    calls: number
    whatsapps: number
    newCandidates: number
  }
  byUser: Record<string, TeamMemberFieldActivity>
}

export type MemberActivityDetail = {
  calls: number
  whatsapps: number
  notes: number
  stageChanges: number
  aiActions: number
  newCandidates: number
  activeDays: number
  /** Pro nabız — yalnızca sponsor Pro ise dolu */
  trainingPct?: number
  objectionPct?: number
  videoPct?: number
  videoCompleted?: number
  videoTotal?: number
  onboardingDone?: number
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
    .select('owner_id, license_type')
    .eq('id', workspaceId)
    .maybeSingle()

  if (ws?.owner_id === user.id) return { supabase, user, licenseType: ws.license_type }

  throw new Error('Bu workspace için yetkiniz yok.')
}

export async function getTeamFieldActivityAction(
  workspaceId: string,
  period: PulsePeriod,
  memberUserIds: string[]
): Promise<TeamFieldActivityResult> {
  const empty: TeamFieldActivityResult = {
    totals: { calls: 0, whatsapps: 0, newCandidates: 0 },
    byUser: {},
  }

  const ctx = await assertWorkspaceMember(workspaceId)
  const { supabase, user } = ctx
  const licenseType =
    'licenseType' in ctx && ctx.licenseType
      ? ctx.licenseType
      : (
          await supabase
            .from('nmm_workspaces')
            .select('license_type')
            .eq('id', workspaceId)
            .single()
        ).data?.license_type

  if (!hasTeamPageAccess(licenseType, isSuperAdmin(user))) return empty

  const uniqueIds = [...new Set(memberUserIds.filter(Boolean))]
  if (uniqueIds.length === 0) return empty

  const byUser: Record<string, TeamMemberFieldActivity> = {}
  for (const uid of uniqueIds) {
    byUser[uid] = { userId: uid, calls: 0, whatsapps: 0, newCandidates: 0, activeDays: 0 }
  }

  const startIso = periodStartIso(period)

  let actionsQuery = supabase
    .from('nmm_daily_actions')
    .select('user_id, action_type, created_at')
    .in('user_id', uniqueIds)
    .in('action_type', ['call', 'whatsapp'])

  if (startIso) {
    actionsQuery = actionsQuery.gte('created_at', startIso)
  }

  const { data: actions } = await actionsQuery

  const activeDaySets: Record<string, Set<string>> = {}
  for (const uid of uniqueIds) activeDaySets[uid] = new Set()

  for (const act of actions ?? []) {
    const bucket = byUser[act.user_id]
    if (!bucket) continue
    if (act.action_type === 'call') bucket.calls++
    else if (act.action_type === 'whatsapp') bucket.whatsapps++
    activeDaySets[act.user_id]?.add(act.created_at.slice(0, 10))
  }

  for (const uid of uniqueIds) {
    byUser[uid].activeDays = activeDaySets[uid]?.size ?? 0
  }

  let candidatesQuery = supabase
    .from('nmm_candidates')
    .select('owner_id, created_at')
    .in('owner_id', uniqueIds)

  if (startIso) {
    candidatesQuery = candidatesQuery.gte('created_at', startIso)
  }

  const { data: newCandidates } = await candidatesQuery

  for (const c of newCandidates ?? []) {
    const bucket = byUser[c.owner_id]
    if (bucket) bucket.newCandidates++
  }

  const totals = { calls: 0, whatsapps: 0, newCandidates: 0 }
  for (const row of Object.values(byUser)) {
    totals.calls += row.calls
    totals.whatsapps += row.whatsapps
    totals.newCandidates += row.newCandidates
  }

  return { totals, byUser }
}

export async function getMemberActivityDetailAction(
  workspaceId: string,
  memberUserId: string,
  period: SheetActivityPeriod
): Promise<MemberActivityDetail> {
  const empty: MemberActivityDetail = {
    calls: 0,
    whatsapps: 0,
    notes: 0,
    stageChanges: 0,
    aiActions: 0,
    newCandidates: 0,
    activeDays: 0,
  }

  const ctx = await assertWorkspaceMember(workspaceId)
  const { supabase, user } = ctx
  const licenseType =
    'licenseType' in ctx && ctx.licenseType
      ? ctx.licenseType
      : (
          await supabase
            .from('nmm_workspaces')
            .select('license_type')
            .eq('id', workspaceId)
            .single()
        ).data?.license_type

  if (!hasTeamPageAccess(licenseType, isSuperAdmin(user))) return empty

  const pulsePeriod: PulsePeriod = period
  const startIso = periodStartIso(pulsePeriod)
  const pulseEnabled = hasTeamPulseAccess(licenseType, isSuperAdmin(user))

  let actionsQuery = supabase
    .from('nmm_daily_actions')
    .select('action_type, created_at')
    .eq('user_id', memberUserId)

  if (startIso) {
    actionsQuery = actionsQuery.gte('created_at', startIso)
  }

  let candidatesQuery = supabase
    .from('nmm_candidates')
    .select('created_at')
    .eq('owner_id', memberUserId)

  if (startIso) {
    candidatesQuery = candidatesQuery.gte('created_at', startIso)
  }

  const [actionsResult, candidatesResult, pulseBundle] = await Promise.all([
    actionsQuery,
    candidatesQuery,
    pulseEnabled
      ? Promise.all([
          supabase
            .from('nmm_user_progress')
            .select('read_trainings, read_objections')
            .eq('user_id', memberUserId)
            .maybeSingle(),
          supabase
            .from('nmm_onboarding_progress')
            .select('step_id')
            .eq('user_id', memberUserId),
          getTeamVideoSummaryMapAction([memberUserId]),
        ])
      : Promise.resolve(null),
  ])

  const { data: actions } = actionsResult
  const { data: newCandidates } = candidatesResult

  const activeDays = new Set<string>()
  const detail: MemberActivityDetail = { ...empty }

  for (const act of actions ?? []) {
    activeDays.add(act.created_at.slice(0, 10))
    switch (act.action_type) {
      case 'call':
        detail.calls++
        break
      case 'whatsapp':
        detail.whatsapps++
        break
      case 'note':
        detail.notes++
        break
      case 'stage_change':
        detail.stageChanges++
        break
      case 'ai_generate':
        detail.aiActions++
        break
    }
  }
  detail.activeDays = activeDays.size
  detail.newCandidates = newCandidates?.length ?? 0

  if (pulseBundle) {
    const [{ data: progressRow }, { data: onboardingRows }, videoMap] = pulseBundle
    const learning = parseLearningProgress(progressRow)
    detail.trainingPct = learning.trainingPct
    detail.objectionPct = learning.objectionPct
    detail.onboardingDone = onboardingRows?.length ?? 0

    const video = videoMap[memberUserId]
    if (video) {
      detail.videoPct = video.pct
      detail.videoCompleted = video.completed
      detail.videoTotal = video.total
    }
  }

  return detail
}
