'use server'

import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/authUser'
import { hasTeamPageAccess, hasTeamPulseAccess } from '@/lib/domain/teamAccess'
import { isSuperAdmin } from '@/lib/domain/auth'
import { periodStartIso, parseLearningProgress, type PulsePeriod, type SheetActivityPeriod } from '@/lib/domain/pulse'
import { istanbulDayKey } from '@/lib/utils/calendarDates'
import type { FunnelCounts } from '@/lib/domain/roadmap'
import {
  fetchFunnelActualsForPeriod,
  fetchFunnelActualsBatchForPeriod,
  fetchFunnelActualsBatchUserDays,
  funnelTotalsForUserInRange,
  funnelRangeForSheetPeriod,
  funnelRangeForPulsePeriod,
  funnelRangeAllTimeSince,
} from '@/lib/domain/funnelActuals'
import { getTeamVideoSummaryMapAction } from '@/app/(dashboard)/egitim/videoActions'
import { TEAM_RANKING_BATCH_PERIODS } from '@/lib/domain/teamRankingBatch'
import {
  funnelTargetsForPulsePeriod,
  goalPayloadToFunnelContext,
} from '@/lib/domain/hubFunnelTargets'
import { getMemberGoalFunnelContextAction } from '@/app/(dashboard)/hedef/actions'

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
  /** Huni gerçekleşenleri — boru hattı tek kaynak (elle sayım yok). */
  funnel: FunnelCounts
  /** Dönem huni hedefleri — üye/lider hedefinden (yol haritası ile hizalı). */
  funnelTargets: FunnelCounts
  hasMemberGoal: boolean
  /** Pro nabız — yalnızca sponsor Pro ise dolu */
  trainingPct?: number
  objectionPct?: number
  videoPct?: number
  videoCompleted?: number
  videoTotal?: number
  onboardingDone?: number
}

export type TeamMemberRankingMetrics = {
  userId: string
  funnel: FunnelCounts
  whatsapps: number
  notes: number
  stageChanges: number
  aiActions: number
  activeDays: number
  totalActions: number
}

export type TeamRankingMetricsResult = {
  byUser: Record<string, TeamMemberRankingMetrics>
}

async function assertWorkspaceMember(workspaceId: string) {
  const supabase = await createClient()
  const { user } = await getAuthUser()
  if (!user) throw new Error('Oturum gerekli.')

  // license_type'ı üyelik sorgusuna JOIN et → her zaman `licenseType` döndürülür.
  // Y-3: çağıranlar artık doğrudan destructure eder; eski 'licenseType' in ctx
  // fallback round-trip'i (ölü koddu) kaldırıldı.
  const { data: membership } = await supabase
    .from('nmm_workspace_members')
    .select('workspace_id, nmm_workspaces(license_type)')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (membership) {
    const licenseType =
      (membership.nmm_workspaces as { license_type: string | null } | null)?.license_type ?? null
    return { supabase, user, licenseType }
  }

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

  const { supabase, user, licenseType } = await assertWorkspaceMember(workspaceId)

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
    activeDaySets[act.user_id]?.add(istanbulDayKey(act.created_at))
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

type DailyActionRow = {
  user_id: string
  action_type: string
  created_at: string
}

function earliestPeriodStartIso(periods: PulsePeriod[]): string | null {
  const starts = periods
    .map(p => periodStartIso(p))
    .filter((iso): iso is string => iso != null)
  if (starts.length === 0) return null
  return starts.reduce((earliest, iso) => (iso < earliest ? iso : earliest))
}

function initRankingBuckets(uniqueIds: string[]): {
  byUser: Record<string, TeamMemberRankingMetrics>
  activeDaySets: Record<string, Set<string>>
} {
  const byUser: Record<string, TeamMemberRankingMetrics> = {}
  const activeDaySets: Record<string, Set<string>> = {}
  for (const uid of uniqueIds) {
    byUser[uid] = {
      userId: uid,
      funnel: { arama: 0, tanisma: 0, sunum: 0, yeniUye: 0 },
      whatsapps: 0,
      notes: 0,
      stageChanges: 0,
      aiActions: 0,
      activeDays: 0,
      totalActions: 0,
    }
    activeDaySets[uid] = new Set()
  }
  return { byUser, activeDaySets }
}

function aggregateRankingFromActions(
  actions: DailyActionRow[],
  period: PulsePeriod,
  uniqueIds: string[],
  funnelByUser: Record<string, FunnelCounts>,
): TeamRankingMetricsResult {
  const startIso = periodStartIso(period)
  const { byUser, activeDaySets } = initRankingBuckets(uniqueIds)

  for (const act of actions) {
    if (startIso && act.created_at < startIso) continue
    const bucket = byUser[act.user_id]
    if (!bucket) continue
    activeDaySets[act.user_id]?.add(istanbulDayKey(act.created_at))
    bucket.totalActions++
    switch (act.action_type) {
      case 'whatsapp':
        bucket.whatsapps++
        break
      case 'note':
        bucket.notes++
        break
      case 'stage_change':
        bucket.stageChanges++
        break
      case 'ai_generate':
        bucket.aiActions++
        break
      default:
        break
    }
  }

  for (const uid of uniqueIds) {
    byUser[uid].funnel = funnelByUser[uid] ?? { arama: 0, tanisma: 0, sunum: 0, yeniUye: 0 }
    byUser[uid].activeDays = activeDaySets[uid]?.size ?? 0
  }

  return { byUser }
}

async function computeTeamRankingMetrics(
  supabase: Awaited<ReturnType<typeof createClient>>,
  period: PulsePeriod,
  uniqueIds: string[],
): Promise<TeamRankingMetricsResult> {
  const funnelRange = funnelRangeForPulsePeriod(period)
  const startIso = periodStartIso(period)

  let actionsQuery = supabase
    .from('nmm_daily_actions')
    .select('user_id, action_type, created_at')
    .in('user_id', uniqueIds)

  if (startIso) {
    actionsQuery = actionsQuery.gte('created_at', startIso)
  }

  const [actionsResult, funnelByUser] = await Promise.all([
    actionsQuery,
    fetchFunnelActualsBatchForPeriod(
      supabase,
      uniqueIds,
      funnelRange.sinceIso,
      funnelRange.untilIso,
      funnelRange.startCalendarKey,
      funnelRange.endCalendarKey,
    ),
  ])

  return aggregateRankingFromActions(actionsResult.data ?? [], period, uniqueIds, funnelByUser)
}

export type TeamRankingMetricsBatchResult = Record<
  'today' | '7d' | '30d' | 'ytd' | 'all',
  TeamRankingMetricsResult
>

export async function getTeamRankingMetricsBatchAction(
  workspaceId: string,
  memberUserIds: string[],
): Promise<TeamRankingMetricsBatchResult> {
  const emptyPeriod = (): TeamRankingMetricsResult => ({ byUser: {} })
  const empty: TeamRankingMetricsBatchResult = {
    today: emptyPeriod(),
    '7d': emptyPeriod(),
    '30d': emptyPeriod(),
    ytd: emptyPeriod(),
    all: emptyPeriod(),
  }

  const { supabase, user, licenseType } = await assertWorkspaceMember(workspaceId)

  if (!hasTeamPageAccess(licenseType, isSuperAdmin(user))) return empty

  const uniqueIds = [...new Set(memberUserIds.filter(Boolean))]
  if (uniqueIds.length === 0) return empty

  const batchStartIso = TEAM_RANKING_BATCH_PERIODS.includes('all')
    ? null
    : earliestPeriodStartIso(TEAM_RANKING_BATCH_PERIODS)
  let actionsQuery = supabase
    .from('nmm_daily_actions')
    .select('user_id, action_type, created_at')
    .in('user_id', uniqueIds)
  if (batchStartIso) {
    actionsQuery = actionsQuery.gte('created_at', batchStartIso)
  }

  const funnelFetchRange = funnelRangeAllTimeSince(
    (
      await supabase.from('nmm_workspaces').select('created_at').eq('id', workspaceId).maybeSingle()
    ).data?.created_at ?? null,
  )
  const [actionsResult, funnelUserDays] = await Promise.all([
    actionsQuery,
    fetchFunnelActualsBatchUserDays(
      supabase,
      uniqueIds,
      funnelFetchRange.sinceIso,
      funnelFetchRange.untilIso,
      funnelFetchRange.startCalendarKey,
      funnelFetchRange.endCalendarKey,
    ),
  ])

  const actions = (actionsResult.data ?? []) as DailyActionRow[]
  const entries = TEAM_RANKING_BATCH_PERIODS.map(period => {
    const range = period === 'all' ? funnelFetchRange : funnelRangeForPulsePeriod(period)
    const funnelByUser: Record<string, FunnelCounts> = {}
    for (const uid of uniqueIds) {
      funnelByUser[uid] = funnelTotalsForUserInRange(
        funnelUserDays.get(uid),
        range.startCalendarKey,
        range.endCalendarKey,
      )
    }
    return [period, aggregateRankingFromActions(actions, period, uniqueIds, funnelByUser)] as const
  })

  return Object.fromEntries(entries) as TeamRankingMetricsBatchResult
}

export async function getTeamRankingMetricsAction(
  workspaceId: string,
  period: PulsePeriod,
  memberUserIds: string[],
): Promise<TeamRankingMetricsResult> {
  const empty: TeamRankingMetricsResult = { byUser: {} }

  const { supabase, user, licenseType } = await assertWorkspaceMember(workspaceId)

  if (!hasTeamPageAccess(licenseType, isSuperAdmin(user))) return empty

  const uniqueIds = [...new Set(memberUserIds.filter(Boolean))]
  if (uniqueIds.length === 0) return empty

  return computeTeamRankingMetrics(supabase, period, uniqueIds)
}

export async function getMemberActivityDetailAction(
  workspaceId: string,
  memberUserId: string,
  period: SheetActivityPeriod
): Promise<MemberActivityDetail> {
  const emptyFunnel: FunnelCounts = { arama: 0, tanisma: 0, sunum: 0, yeniUye: 0 }
  const empty: MemberActivityDetail = {
    calls: 0,
    whatsapps: 0,
    notes: 0,
    stageChanges: 0,
    aiActions: 0,
    newCandidates: 0,
    activeDays: 0,
    funnel: emptyFunnel,
    funnelTargets: emptyFunnel,
    hasMemberGoal: false,
  }

  const { supabase, user, licenseType } = await assertWorkspaceMember(workspaceId)

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

  const funnelRange = funnelRangeForSheetPeriod(period)

  const [actionsResult, candidatesResult, funnel, goalCtx, pulseBundle] = await Promise.all([
    actionsQuery,
    candidatesQuery,
    fetchFunnelActualsForPeriod(
      supabase,
      memberUserId,
      funnelRange.sinceIso,
      funnelRange.untilIso,
      funnelRange.startCalendarKey,
      funnelRange.endCalendarKey,
    ),
    getMemberGoalFunnelContextAction(workspaceId, memberUserId),
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
    activeDays.add(istanbulDayKey(act.created_at))
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
  detail.funnel = funnel

  if (goalCtx.hasGoal && goalCtx.goal) {
    const funnelCtx = goalPayloadToFunnelContext(goalCtx.goal, goalCtx.roadmap)
    detail.funnelTargets = funnelTargetsForPulsePeriod(funnelCtx, period)
    detail.hasMemberGoal = true
  }

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
