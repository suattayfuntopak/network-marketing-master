'use server'

import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/authUser'
import {
  getDailyProgressAction,
  fetchUserGoalAction,
  type DailyProgress,
  type UserGoal,
} from '@/app/(dashboard)/hedef/actions'
import { fetchTeamBundleAction } from '@/app/(dashboard)/actions/team'
import { getTeamFieldActivityAction } from '@/app/(dashboard)/istatistikler/teamActivityActions'
import {
  getTeamVideoSummaryMapAction,
  getVideoCatalogAction,
} from '@/app/(dashboard)/egitim/videoActions'
import { getMemberGoalsMapAction } from '@/app/(dashboard)/ekip/memberGoalsActions'
import { ONBOARDING_STEPS } from '@/lib/team/types'
import { periodStartIso } from '@/lib/domain/pulse'
import type { FunnelCounts } from '@/lib/domain/roadmap'
import { STAGE_ORDER } from '@/lib/domain/stages'
import type { CandidateStage } from '@/types/database.types'
import { todayCalendarKey, istanbulDayStartIso } from '@/lib/utils/calendarDates'
import { rollingWeekRange, monthRange } from '@/lib/utils/hubPeriodRange'

const EMPTY_FUNNEL: FunnelCounts = { arama: 0, tanisma: 0, sunum: 0, yeniUye: 0 }

function todayStartIso(): string {
  return istanbulDayStartIso(todayCalendarKey())
}

/** @deprecated rollingWeekRange(0) kullanın */
function last7CalendarDaysStartIso(): string {
  return rollingWeekRange(0).sinceIso
}
import type { TeamMember } from '@/hooks/useTeamMembers'
import type { MemberRow } from '@/lib/team/types'
import type { VideoProgressSummary } from '@/lib/domain/videoProgress'
import type { MemberGoalRow } from '@/app/(dashboard)/ekip/memberGoalsActions'
import type { TeamFieldActivityResult } from '@/app/(dashboard)/istatistikler/teamActivityActions'

const ONBOARDING_TOTAL = ONBOARDING_STEPS.length

async function resolveWorkspaceId(): Promise<string | null> {
  const supabase = await createClient()
  const { user } = await getAuthUser()
  if (!user) return null
  const { data } = await supabase
    .from('nmm_workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (data?.workspace_id) return data.workspace_id
  const { data: owned } = await supabase
    .from('nmm_workspaces')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()
  return owned?.id ?? null
}

export type CrownDailyPayload = {
  progress: DailyProgress
  goal: UserGoal | null
}

export async function getCrownDailyPageAction(): Promise<CrownDailyPayload> {
  const [progress, goal] = await Promise.all([getDailyProgressAction(), fetchUserGoalAction()])
  return { progress, goal }
}

export type CrownTeamStats = {
  activeCount: number
  weeklyCalls: number
  newMembersWeek: number
}

export type CrownTeamPayload = {
  rows: MemberRow[]
  videoMap: Record<string, VideoProgressSummary>
  goalsMap: Record<string, MemberGoalRow>
  totalTeam: number
  stats: CrownTeamStats
}

export async function getCrownTeamPageAction(workspaceId: string): Promise<CrownTeamPayload> {
  const bundle = await fetchTeamBundleAction(workspaceId)
  const memberIds = bundle.members.map(m => m.user_id)
  const [videoMap, goalsMap, activity, newMembersWeek] = await Promise.all([
    getTeamVideoSummaryMapAction(memberIds),
    getMemberGoalsMapAction(workspaceId, memberIds),
    getTeamFieldActivityAction(workspaceId, '7d', memberIds),
    countJoinedInPeriod(memberIds, periodStartIso('7d')),
  ])
  const now = Date.now()
  const activeCount = bundle.ekipRows.filter(m => {
    if (!m.last_activity_at) return false
    return (now - new Date(m.last_activity_at).getTime()) / 86_400_000 < 7
  }).length
  return {
    rows: bundle.ekipRows,
    videoMap,
    goalsMap,
    totalTeam: bundle.ekipRows.length,
    stats: {
      activeCount,
      weeklyCalls: activity.totals.calls,
      newMembersWeek,
    },
  }
}

export type CrownVideoHighlight = {
  key: string
  titleTr: string
  titleEn: string
}

export type CrownVideoPayload = {
  members: TeamMember[]
  videoTotal: number
  videoMap: Record<string, VideoProgressSummary>
  leaderSummary: VideoProgressSummary | null
  lastWatched: CrownVideoHighlight | null
  nextVideo: CrownVideoHighlight | null
  teamAvgPct: number
}

export async function getCrownVideoPageAction(workspaceId: string): Promise<CrownVideoPayload> {
  const bundle = await fetchTeamBundleAction(workspaceId)
  const memberIds = bundle.members.map(m => m.user_id)
  const [catalog, videoMap] = await Promise.all([
    getVideoCatalogAction(workspaceId),
    getTeamVideoSummaryMapAction(memberIds),
  ])
  const { user } = await getAuthUser()
  const leaderSummary = user ? (videoMap[user.id] ?? null) : null

  const sorted = [...catalog.videos].sort((a, b) => a.sortOrder - b.sortOrder)
  let lastWatched: CrownVideoHighlight | null = null
  let lastCompletedAt = ''
  for (const v of sorted) {
    const p = catalog.progressByKey[v.key]
    const done = p?.status === 'completed' || (p?.watch_percent ?? 0) >= 90
    const at = p?.completed_at ?? p?.started_at ?? ''
    if (done && at >= lastCompletedAt) {
      lastCompletedAt = at
      lastWatched = { key: v.key, titleTr: v.titleTr, titleEn: v.titleEn }
    }
  }
  let nextVideo: CrownVideoHighlight | null = null
  for (const v of sorted) {
    const p = catalog.progressByKey[v.key]
    const done = p?.status === 'completed' || (p?.watch_percent ?? 0) >= 90
    if (!done) {
      nextVideo = { key: v.key, titleTr: v.titleTr, titleEn: v.titleEn }
      break
    }
  }

  const pcts = Object.values(videoMap).map(s => s.pct)
  const teamAvgPct = pcts.length > 0 ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0

  return {
    members: bundle.members,
    videoTotal: catalog.summary.total,
    videoMap,
    leaderSummary: leaderSummary ?? catalog.summary,
    lastWatched,
    nextVideo,
    teamAvgPct,
  }
}

export type CrownPeriodPayload = {
  members: TeamMember[]
  activity: TeamFieldActivityResult
  joinedInPeriod: number
}

async function countJoinedInPeriod(
  memberIds: string[],
  startIso: string | null,
): Promise<number> {
  if (memberIds.length === 0) return 0
  const supabase = await createClient()
  let q = supabase
    .from('nmm_candidates')
    .select('id', { count: 'exact', head: true })
    .eq('stage', 'katildi')
    .in('owner_id', memberIds)
  if (startIso) q = q.gte('updated_at', startIso)
  const { count } = await q
  return count ?? 0
}

export async function getCrownWeeklyPageAction(workspaceId: string): Promise<CrownPeriodPayload> {
  const bundle = await fetchTeamBundleAction(workspaceId)
  const memberIds = bundle.members.map(m => m.user_id)
  const [activity, joinedInPeriod] = await Promise.all([
    getTeamFieldActivityAction(workspaceId, '7d', memberIds),
    countJoinedInPeriod(memberIds, periodStartIso('7d')),
  ])
  return { members: bundle.members, activity, joinedInPeriod }
}

export async function getCrownMonthlyPageAction(workspaceId: string): Promise<CrownPeriodPayload> {
  const bundle = await fetchTeamBundleAction(workspaceId)
  const memberIds = bundle.members.map(m => m.user_id)
  const [activity, joinedInPeriod] = await Promise.all([
    getTeamFieldActivityAction(workspaceId, '30d', memberIds),
    countJoinedInPeriod(memberIds, periodStartIso('30d')),
  ])
  return { members: bundle.members, activity, joinedInPeriod }
}

export type CrownMemberEntry = {
  userId: string
  fullName: string
  entryDays: number
  lastEntry: string | null
  calls: number
  newCandidates: number
  presentations: number
  newMembers: number
}

export type CrownEntriesPayload = {
  entries: CrownMemberEntry[]
}

export async function getCrownEntriesPageAction(workspaceId: string): Promise<CrownEntriesPayload> {
  const bundle = await fetchTeamBundleAction(workspaceId)
  const memberIds = bundle.members.map(m => m.user_id)
  if (memberIds.length === 0) return { entries: [] }

  const supabase = await createClient()
  const startIso = periodStartIso('30d')

  let actionsQuery = supabase
    .from('nmm_daily_actions')
    .select('user_id, action_type, created_at, note')
    .in('user_id', memberIds)

  if (startIso) actionsQuery = actionsQuery.gte('created_at', startIso)

  const { data: actions } = await actionsQuery

  const byUser: Record<
    string,
    { days: Set<string>; last: string | null; calls: number; newCand: number; sunum: number; yeniUye: number }
  > = {}
  for (const id of memberIds) {
    byUser[id] = { days: new Set(), last: null, calls: 0, newCand: 0, sunum: 0, yeniUye: 0 }
  }

  for (const act of actions ?? []) {
    const bucket = byUser[act.user_id]
    if (!bucket) continue
    const day = act.created_at.slice(0, 10)
    bucket.days.add(day)
    if (!bucket.last || act.created_at > bucket.last) bucket.last = act.created_at
    if (act.action_type === 'call') bucket.calls++
    else if (act.action_type === 'stage_change') {
      const note = (act.note ?? '').toLowerCase().trim()
      if (note === 'sunum' || note === 'sunum yapıldı') bucket.sunum++
      else if (note === 'katildi' || note === 'katıldı' || note === 'joined') bucket.yeniUye++
    }
  }

  let candQuery = supabase.from('nmm_candidates').select('owner_id').in('owner_id', memberIds)
  if (startIso) candQuery = candQuery.gte('created_at', startIso)
  const { data: newCands } = await candQuery
  for (const c of newCands ?? []) {
    const bucket = byUser[c.owner_id]
    if (bucket) bucket.newCand++
  }

  const entries: CrownMemberEntry[] = bundle.members.map(m => {
    const b = byUser[m.user_id]
    return {
      userId: m.user_id,
      fullName: m.full_name ?? '—',
      entryDays: b?.days.size ?? 0,
      lastEntry: b?.last ? b.last.slice(0, 10) : m.last_activity_at?.slice(0, 10) ?? null,
      calls: b?.calls ?? 0,
      newCandidates: b?.newCand ?? 0,
      presentations: b?.sunum ?? 0,
      newMembers: b?.yeniUye ?? 0,
    }
  })

  entries.sort((a, b) => b.entryDays - a.entryDays)
  return { entries }
}

export type CrownFirst30Member = {
  userId: string
  fullName: string
  done: number
  total: number
  pct: number
  joinedAt: string | null
  phone: string | null
  daysLeft: number
  daysElapsed: number
  missingStepIds: string[]
  riskLevel: 'ok' | 'warn' | 'danger'
}

export type CrownFirst30Payload = {
  members: CrownFirst30Member[]
}

export async function getCrownFirst30PageAction(workspaceId: string): Promise<CrownFirst30Payload> {
  const bundle = await fetchTeamBundleAction(workspaceId)
  const now = Date.now()
  const members: CrownFirst30Member[] = bundle.ekipRows.map(m => {
    const doneSteps = m.onboarding_steps ?? []
    const done = doneSteps.length
    const pct = ONBOARDING_TOTAL > 0 ? Math.round((done / ONBOARDING_TOTAL) * 100) : 0
    const joinedMs = m.joined_at ? new Date(m.joined_at).getTime() : now
    const daysElapsed = Math.min(30, Math.floor((now - joinedMs) / 86_400_000))
    const daysLeft = Math.max(0, 30 - daysElapsed)
    const missingStepIds = ONBOARDING_STEPS.filter(s => !doneSteps.includes(s.id)).map(s => s.id)
    const riskLevel: CrownFirst30Member['riskLevel'] =
      pct < 30 && daysElapsed > 20 ? 'danger' : pct < 50 && daysElapsed > 14 ? 'warn' : 'ok'
    return {
      userId: m.user_id,
      fullName: m.full_name ?? '—',
      done,
      total: ONBOARDING_TOTAL,
      pct,
      joinedAt: m.joined_at,
      phone: m.phone ?? null,
      daysLeft,
      daysElapsed,
      missingStepIds,
      riskLevel,
    }
  })
  members.sort((a, b) => a.daysLeft - b.daysLeft || a.pct - b.pct)
  return { members }
}

export type HubSelfFieldMetrics = {
  calls: number
  whatsapps: number
  notes: number
  stageChanges: number
  aiActions: number
  newCandidates: number
  activeDays: number
  totalActions: number
}

export type HubPipelineStageCounts = Partial<Record<CandidateStage, number>>

const EMPTY_FIELD_METRICS: HubSelfFieldMetrics = {
  calls: 0,
  whatsapps: 0,
  notes: 0,
  stageChanges: 0,
  aiActions: 0,
  newCandidates: 0,
  activeDays: 0,
  totalActions: 0,
}

export type HubWeeklySelfPayload = {
  hasGoal: boolean
  weeklyTargets: FunnelCounts
  weeklyActuals: FunnelCounts
  pctOverall: number
  callsGap: number
  loginDays: number
  /** Son 7 takvim günü — giriş yapılan günler */
  weekActive: boolean[]
  fieldMetrics: HubSelfFieldMetrics
  pipelineStages: HubPipelineStageCounts
}

export type HubMonthlySelfPayload = {
  hasGoal: boolean
  monthlyTargets: FunnelCounts
  monthlyActuals: FunnelCounts
  loginDays: number
  dayOfMonth: number
  daysInMonth: number
  monthPct: number
  fieldMetrics: HubSelfFieldMetrics
  pipelineStages: HubPipelineStageCounts
}

async function loginDaysInWindow(
  userId: string,
  since: string,
  until: string,
  windowStart: Date,
  windowEnd: Date,
): Promise<{ count: number; weekActive: boolean[] }> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('nmm_daily_actions')
    .select('created_at')
    .eq('user_id', userId)
    .gte('created_at', since)
    .lte('created_at', until)

  const daySet = new Set<string>()
  for (const row of data ?? []) {
    daySet.add(row.created_at.slice(0, 10))
  }

  const weekActive: boolean[] = []
  const cursor = new Date(windowStart)
  cursor.setHours(0, 0, 0, 0)
  const end = new Date(windowEnd)
  end.setHours(0, 0, 0, 0)
  while (cursor <= end) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`
    weekActive.push(daySet.has(key))
    cursor.setDate(cursor.getDate() + 1)
  }

  return { count: weekActive.filter(Boolean).length, weekActive }
}

async function loginDaysSince(userId: string, since: string): Promise<{ count: number; weekActive: boolean[] }> {
  const range = rollingWeekRange(0)
  return loginDaysInWindow(userId, since, range.untilIso, range.startDate, range.endDate)
}

async function loginDaysInRange(userId: string, since: string, until?: string): Promise<number> {
  const supabase = await createClient()
  let query = supabase
    .from('nmm_daily_actions')
    .select('created_at')
    .eq('user_id', userId)
    .gte('created_at', since)
  if (until) query = query.lte('created_at', until)

  const { data } = await query

  const daySet = new Set<string>()
  for (const row of data ?? []) {
    daySet.add(row.created_at.slice(0, 10))
  }
  return daySet.size
}

async function selfFieldMetricsSince(
  userId: string,
  workspaceId: string | null,
  since: string | null,
  until?: string | null,
): Promise<HubSelfFieldMetrics> {
  const supabase = await createClient()

  let actionsQuery = supabase
    .from('nmm_daily_actions')
    .select('action_type, created_at')
    .eq('user_id', userId)

  if (since) actionsQuery = actionsQuery.gte('created_at', since)
  if (until) actionsQuery = actionsQuery.lte('created_at', until)

  let candidatesQuery = supabase
    .from('nmm_candidates')
    .select('created_at')
    .eq('owner_id', userId)

  if (workspaceId) candidatesQuery = candidatesQuery.eq('workspace_id', workspaceId)
  if (since) candidatesQuery = candidatesQuery.gte('created_at', since)
  if (until) candidatesQuery = candidatesQuery.lte('created_at', until)

  const [{ data: actions }, { data: newCandidates }] = await Promise.all([
    actionsQuery,
    candidatesQuery,
  ])

  const activeDays = new Set<string>()
  const metrics: HubSelfFieldMetrics = { ...EMPTY_FIELD_METRICS }

  for (const act of actions ?? []) {
    activeDays.add(act.created_at.slice(0, 10))
    switch (act.action_type) {
      case 'call':
        metrics.calls++
        break
      case 'whatsapp':
        metrics.whatsapps++
        break
      case 'note':
        metrics.notes++
        break
      case 'stage_change':
        metrics.stageChanges++
        break
      case 'ai_generate':
        metrics.aiActions++
        break
    }
  }

  metrics.newCandidates = newCandidates?.length ?? 0
  metrics.activeDays = activeDays.size
  metrics.totalActions =
    metrics.calls + metrics.whatsapps + metrics.notes + metrics.stageChanges + metrics.aiActions

  return metrics
}

async function pipelineStageCountsForUser(
  userId: string,
  workspaceId: string | null,
): Promise<HubPipelineStageCounts> {
  if (!workspaceId) return {}

  const supabase = await createClient()
  const { data } = await supabase
    .from('nmm_candidates')
    .select('stage')
    .eq('owner_id', userId)
    .eq('workspace_id', workspaceId)

  const counts: HubPipelineStageCounts = {}
  for (const stage of STAGE_ORDER) counts[stage] = 0
  for (const row of data ?? []) {
    const stage = row.stage as CandidateStage
    if (counts[stage] !== undefined) counts[stage]!++
  }
  return counts
}

async function funnelActualsSince(
  userId: string,
  since: string,
  until?: string,
): Promise<FunnelCounts> {
  const supabase = await createClient()
  let callsQuery = supabase
    .from('nmm_daily_actions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('action_type', 'call')
    .gte('created_at', since)
  let stageQuery = supabase
    .from('nmm_daily_actions')
    .select('note')
    .eq('user_id', userId)
    .eq('action_type', 'stage_change')
    .gte('created_at', since)
  let newCandQuery = supabase
    .from('nmm_candidates')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', userId)
    .gte('created_at', since)
  if (until) {
    callsQuery = callsQuery.lte('created_at', until)
    stageQuery = stageQuery.lte('created_at', until)
    newCandQuery = newCandQuery.lte('created_at', until)
  }
  const [callsRes, stageRes, newCandRes] = await Promise.all([callsQuery, stageQuery, newCandQuery])
  let sunum = 0
  let yeniUye = 0
  for (const row of stageRes.data ?? []) {
    const note = (row.note ?? '').toLowerCase().trim()
    if (note === 'sunum' || note === 'sunum yapıldı') sunum++
    else if (note === 'katildi' || note === 'katıldı' || note === 'joined') yeniUye++
  }
  return {
    arama: callsRes.count ?? 0,
    tanisma: newCandRes.count ?? 0,
    sunum,
    yeniUye,
  }
}

export async function getHubWeeklySelfAction(offset = 0): Promise<HubWeeklySelfPayload> {
  const progress = await getDailyProgressAction()
  const { user } = await getAuthUser()
  const workspaceId = await resolveWorkspaceId()
  const range = rollingWeekRange(offset)

  if (!user) {
    return {
      hasGoal: false,
      weeklyTargets: EMPTY_FUNNEL,
      weeklyActuals: EMPTY_FUNNEL,
      pctOverall: 0,
      callsGap: 0,
      loginDays: 0,
      weekActive: Array.from({ length: 7 }, () => false),
      fieldMetrics: EMPTY_FIELD_METRICS,
      pipelineStages: {},
    }
  }

  const since = range.sinceIso
  const until = range.untilIso
  const [weeklyActuals, loginInfo, fieldMetrics, pipelineStages] = await Promise.all([
    funnelActualsSince(user.id, since, until),
    loginDaysInWindow(user.id, since, until, range.startDate, range.endDate),
    selfFieldMetricsSince(user.id, workspaceId, since, until),
    pipelineStageCountsForUser(user.id, workspaceId),
  ])

  if (!progress.hasGoal) {
    return {
      hasGoal: false,
      weeklyTargets: EMPTY_FUNNEL,
      weeklyActuals,
      pctOverall: 0,
      callsGap: 0,
      loginDays: loginInfo.count,
      weekActive: loginInfo.weekActive,
      fieldMetrics,
      pipelineStages,
    }
  }

  const weeklyTargets: FunnelCounts = {
    arama: progress.targets.arama * 7,
    tanisma: progress.targets.tanisma * 7,
    sunum: progress.targets.sunum * 7,
    yeniUye: progress.targets.yeniUye * 7,
  }
  const pctOverall =
    weeklyTargets.arama > 0
      ? Math.min(999, Math.round((weeklyActuals.arama / weeklyTargets.arama) * 100))
      : 0
  const callsGap = Math.max(0, weeklyTargets.arama - weeklyActuals.arama)
  return {
    hasGoal: true,
    weeklyTargets,
    weeklyActuals,
    pctOverall,
    callsGap,
    loginDays: loginInfo.count,
    weekActive: loginInfo.weekActive,
    fieldMetrics,
    pipelineStages,
  }
}

export async function getHubMonthlySelfAction(offset = 0): Promise<HubMonthlySelfPayload> {
  const progress = await getDailyProgressAction()
  const { user } = await getAuthUser()
  const workspaceId = await resolveWorkspaceId()
  const range = monthRange(offset)
  const { dayOfMonth, daysInMonth, monthPct } = range
  const monthStart = range.sinceIso
  const monthEnd = range.untilIso

  if (!user) {
    return {
      hasGoal: false,
      monthlyTargets: EMPTY_FUNNEL,
      monthlyActuals: EMPTY_FUNNEL,
      loginDays: 0,
      dayOfMonth,
      daysInMonth,
      monthPct,
      fieldMetrics: EMPTY_FIELD_METRICS,
      pipelineStages: {},
    }
  }

  const [monthlyActuals, loginDays, fieldMetrics, pipelineStages] = await Promise.all([
    funnelActualsSince(user.id, monthStart, monthEnd),
    loginDaysInRange(user.id, monthStart, monthEnd),
    selfFieldMetricsSince(user.id, workspaceId, monthStart, monthEnd),
    pipelineStageCountsForUser(user.id, workspaceId),
  ])

  if (!progress.hasGoal) {
    return {
      hasGoal: false,
      monthlyTargets: EMPTY_FUNNEL,
      monthlyActuals,
      loginDays,
      dayOfMonth,
      daysInMonth,
      monthPct,
      fieldMetrics,
      pipelineStages,
    }
  }

  const monthlyTargets: FunnelCounts = {
    arama: progress.targets.arama * daysInMonth,
    tanisma: progress.targets.tanisma * daysInMonth,
    sunum: progress.targets.sunum * daysInMonth,
    yeniUye: progress.targets.yeniUye * daysInMonth,
  }

  return {
    hasGoal: true,
    monthlyTargets,
    monthlyActuals,
    loginDays,
    dayOfMonth,
    daysInMonth,
    monthPct,
    fieldMetrics,
    pipelineStages,
  }
}

export type HubMonthlyInsights = {
  dayOfMonth: number
  daysInMonth: number
  monthPct: number
  monthActuals: { calls: number; newCandidates: number; presentations: number }
  prevMonthCalls: number
  currMonthCalls: number
  trend: 'up' | 'down' | 'flat'
}

export async function getHubMonthlyInsightsAction(): Promise<HubMonthlyInsights> {
  const supabase = await createClient()
  const { user } = await getAuthUser()
  const now = new Date()
  const dayOfMonth = now.getDate()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const monthPct = Math.round((dayOfMonth / daysInMonth) * 100)

  if (!user) {
    return {
      dayOfMonth,
      daysInMonth,
      monthPct,
      monthActuals: { calls: 0, newCandidates: 0, presentations: 0 },
      prevMonthCalls: 0,
      currMonthCalls: 0,
      trend: 'flat',
    }
  }

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const prevMonthEnd = monthStart

  const [currCalls, prevCalls, stageRes, newCandRes] = await Promise.all([
    supabase
      .from('nmm_daily_actions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('action_type', 'call')
      .gte('created_at', monthStart),
    supabase
      .from('nmm_daily_actions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('action_type', 'call')
      .gte('created_at', prevMonthStart)
      .lt('created_at', prevMonthEnd),
    supabase
      .from('nmm_daily_actions')
      .select('note')
      .eq('user_id', user.id)
      .eq('action_type', 'stage_change')
      .gte('created_at', monthStart),
    supabase
      .from('nmm_candidates')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', user.id)
      .gte('created_at', monthStart),
  ])

  let presentations = 0
  for (const row of stageRes.data ?? []) {
    const note = (row.note ?? '').toLowerCase().trim()
    if (note === 'sunum' || note === 'sunum yapıldı') presentations++
  }

  const currMonthCalls = currCalls.count ?? 0
  const prevMonthCalls = prevCalls.count ?? 0
  const trend: HubMonthlyInsights['trend'] =
    currMonthCalls > prevMonthCalls ? 'up' : currMonthCalls < prevMonthCalls ? 'down' : 'flat'

  return {
    dayOfMonth,
    daysInMonth,
    monthPct,
    monthActuals: {
      calls: currMonthCalls,
      newCandidates: newCandRes.count ?? 0,
      presentations,
    },
    prevMonthCalls,
    currMonthCalls,
    trend,
  }
}

export async function logHubContactAction(
  workspaceId: string,
  candidateId: string,
  actionType: 'call' | 'whatsapp',
): Promise<void> {
  const supabase = await createClient()
  const { user } = await getAuthUser()
  if (!user) throw new Error('Oturum bulunamadı.')

  const { data: candidate } = await supabase
    .from('nmm_candidates')
    .select('id')
    .eq('id', candidateId)
    .eq('workspace_id', workspaceId)
    .eq('owner_id', user.id)
    .maybeSingle()
  if (!candidate) throw new Error('Aday bulunamadı.')

  const now = new Date().toISOString()
  const { error } = await supabase.from('nmm_daily_actions').insert({
    workspace_id: workspaceId,
    user_id: user.id,
    candidate_id: candidateId,
    action_type: actionType,
  })
  if (error) throw new Error(error.message)

  await supabase.from('nmm_candidates').update({ last_contact_at: now }).eq('id', candidateId)
}

export async function getCrownWorkspaceIdAction(): Promise<string | null> {
  return resolveWorkspaceId()
}
