'use server'

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/authUser'
import { getDailyProgressAction } from '@/app/(dashboard)/hedef/actions'
import type { FunnelCounts } from '@/lib/domain/roadmap'
import { STAGE_ORDER } from '@/lib/domain/stages'
import type { CandidateStage } from '@/types/database.types'
import { todayCalendarKey, toCalendarKey } from '@/lib/utils/calendarDates'
import { fetchFunnelActualsForPeriod, funnelRangeForPulsePeriod } from '@/lib/domain/funnelActuals'
import { calendarDayRange, rollingWeekRange, monthRange, yearRange } from '@/lib/utils/hubPeriodRange'

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
  weekActive: boolean[]
  fieldMetrics: HubSelfFieldMetrics
  pipelineStages: HubPipelineStageCounts
}

export type HubDailySelfPayload = {
  hasGoal: boolean
  dailyTargets: FunnelCounts
  dailyActuals: FunnelCounts
  dayActive: boolean
  calendarKey: string
  isToday: boolean
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

export type HubYearlySelfPayload = {
  hasGoal: boolean
  yearlyTargets: FunnelCounts
  yearlyActuals: FunnelCounts
  loginDays: number
  year: number
  dayOfYear: number
  daysInPeriod: number
  totalDaysInYear: number
  yearPct: number
  isCurrentYear: boolean
  fieldMetrics: HubSelfFieldMetrics
}

export type HubAllTimeSelfPayload = {
  hasGoal: boolean
  allTimeActuals: FunnelCounts
  fieldMetrics: HubSelfFieldMetrics
  joinedAt: string | null
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

// cache(): tek render içinde birden çok hub action çağrıldığında workspace lookup
// 4 kez değil 1 kez yapılır.
const resolveWorkspaceId = cache(async (): Promise<string | null> => {
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
})

export async function getCrownWorkspaceIdAction(): Promise<string | null> {
  return resolveWorkspaceId()
}

// ─── Private helpers ─────────────────────────────────────────────────────────

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
  until: string,
  startCalendarKey: string,
  endCalendarKey: string,
): Promise<FunnelCounts> {
  const supabase = await createClient()
  return fetchFunnelActualsForPeriod(
    supabase,
    userId,
    since,
    until,
    startCalendarKey,
    endCalendarKey,
  )
}

const EMPTY_FUNNEL: FunnelCounts = { arama: 0, tanisma: 0, sunum: 0, yeniUye: 0 }

// ─── Hub Self Actions ─────────────────────────────────────────────────────────

export async function getHubWeeklySelfAction(offset = 0): Promise<HubWeeklySelfPayload> {
  const [progress, { user }, workspaceId] = await Promise.all([
    getDailyProgressAction(),
    getAuthUser(),
    resolveWorkspaceId(),
  ])
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
    funnelActualsSince(user.id, since, until, toCalendarKey(range.startDate), toCalendarKey(range.endDate)),
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

export async function getHubDailySelfAction(offset = 0): Promise<HubDailySelfPayload> {
  const [progress, { user }, workspaceId] = await Promise.all([
    getDailyProgressAction(),
    getAuthUser(),
    resolveWorkspaceId(),
  ])
  const range = calendarDayRange(offset)
  const todayKey = todayCalendarKey()

  if (!user) {
    return {
      hasGoal: false,
      dailyTargets: EMPTY_FUNNEL,
      dailyActuals: EMPTY_FUNNEL,
      dayActive: false,
      calendarKey: range.calendarKey,
      isToday: range.calendarKey === todayKey,
      fieldMetrics: EMPTY_FIELD_METRICS,
      pipelineStages: {},
    }
  }

  const since = range.sinceIso
  const until = range.untilIso
  const [dailyActuals, loginInfo, fieldMetrics, pipelineStages] = await Promise.all([
    funnelActualsSince(user.id, since, until, range.calendarKey, range.calendarKey),
    loginDaysInWindow(user.id, since, until, range.date, range.date),
    selfFieldMetricsSince(user.id, workspaceId, since, until),
    pipelineStageCountsForUser(user.id, workspaceId),
  ])

  const dayActive = loginInfo.weekActive[0] ?? false

  if (!progress.hasGoal) {
    return {
      hasGoal: false,
      dailyTargets: EMPTY_FUNNEL,
      dailyActuals,
      dayActive,
      calendarKey: range.calendarKey,
      isToday: range.calendarKey === todayKey,
      fieldMetrics,
      pipelineStages,
    }
  }

  return {
    hasGoal: true,
    dailyTargets: progress.targets,
    dailyActuals,
    dayActive,
    calendarKey: range.calendarKey,
    isToday: range.calendarKey === todayKey,
    fieldMetrics,
    pipelineStages,
  }
}

export async function getHubMonthlySelfAction(offset = 0): Promise<HubMonthlySelfPayload> {
  const [progress, { user }, workspaceId] = await Promise.all([
    getDailyProgressAction(),
    getAuthUser(),
    resolveWorkspaceId(),
  ])
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
    funnelActualsSince(
      user.id,
      monthStart,
      monthEnd,
      toCalendarKey(range.startDate),
      toCalendarKey(range.endDate),
    ),
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

export async function getHubYearlySelfAction(offset = 0): Promise<HubYearlySelfPayload> {
  const [progress, { user }, workspaceId] = await Promise.all([
    getDailyProgressAction(),
    getAuthUser(),
    resolveWorkspaceId(),
  ])
  const range = yearRange(offset)

  if (!user) {
    return {
      hasGoal: false,
      yearlyTargets: EMPTY_FUNNEL,
      yearlyActuals: EMPTY_FUNNEL,
      loginDays: 0,
      year: range.year,
      dayOfYear: range.dayOfYear,
      daysInPeriod: range.daysInPeriod,
      totalDaysInYear: range.totalDaysInYear,
      yearPct: range.yearPct,
      isCurrentYear: range.isCurrentYear,
      fieldMetrics: EMPTY_FIELD_METRICS,
    }
  }

  const since = range.sinceIso
  const until = range.untilIso
  const [yearlyActuals, loginDays, fieldMetrics] = await Promise.all([
    funnelActualsSince(
      user.id,
      since,
      until,
      toCalendarKey(range.startDate),
      toCalendarKey(range.endDate),
    ),
    loginDaysInRange(user.id, since, until),
    selfFieldMetricsSince(user.id, workspaceId, since, until),
  ])

  if (!progress.hasGoal) {
    return {
      hasGoal: false,
      yearlyTargets: EMPTY_FUNNEL,
      yearlyActuals,
      loginDays,
      year: range.year,
      dayOfYear: range.dayOfYear,
      daysInPeriod: range.daysInPeriod,
      totalDaysInYear: range.totalDaysInYear,
      yearPct: range.yearPct,
      isCurrentYear: range.isCurrentYear,
      fieldMetrics,
    }
  }

  const days = range.daysInPeriod
  const yearlyTargets: FunnelCounts = {
    arama: progress.targets.arama * days,
    tanisma: progress.targets.tanisma * days,
    sunum: progress.targets.sunum * days,
    yeniUye: progress.targets.yeniUye * days,
  }

  return {
    hasGoal: true,
    yearlyTargets,
    yearlyActuals,
    loginDays,
    year: range.year,
    dayOfYear: range.dayOfYear,
    daysInPeriod: range.daysInPeriod,
    totalDaysInYear: range.totalDaysInYear,
    yearPct: range.yearPct,
    isCurrentYear: range.isCurrentYear,
    fieldMetrics,
  }
}

export async function getHubAllTimeSelfAction(): Promise<HubAllTimeSelfPayload> {
  const [progress, { user }, workspaceId] = await Promise.all([
    getDailyProgressAction(),
    getAuthUser(),
    resolveWorkspaceId(),
  ])
  const range = funnelRangeForPulsePeriod('all')

  if (!user || !workspaceId) {
    return {
      hasGoal: false,
      allTimeActuals: EMPTY_FUNNEL,
      fieldMetrics: EMPTY_FIELD_METRICS,
      joinedAt: null,
    }
  }

  const supabase = await createClient()
  const [allTimeActuals, fieldMetrics, wsData] = await Promise.all([
    funnelActualsSince(
      user.id,
      range.sinceIso,
      range.untilIso,
      range.startCalendarKey,
      range.endCalendarKey,
    ),
    selfFieldMetricsSince(user.id, workspaceId, range.sinceIso, range.untilIso),
    supabase.from('nmm_workspaces').select('created_at').eq('id', workspaceId).maybeSingle(),
  ])

  return {
    hasGoal: progress.hasGoal,
    allTimeActuals,
    fieldMetrics,
    joinedAt: wsData.data?.created_at ?? null,
  }
}

export async function getHubMonthlyInsightsAction(): Promise<HubMonthlyInsights> {
  const supabase = await createClient()
  const { user } = await getAuthUser()
  const range = monthRange(0)
  const { dayOfMonth, daysInMonth, monthPct } = range

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

  const prevRange = monthRange(-1)
  const [monthFunnel, prevMonthFunnel] = await Promise.all([
    fetchFunnelActualsForPeriod(
      supabase,
      user.id,
      range.sinceIso,
      range.untilIso,
      toCalendarKey(range.startDate),
      toCalendarKey(range.endDate),
    ),
    fetchFunnelActualsForPeriod(
      supabase,
      user.id,
      prevRange.sinceIso,
      prevRange.untilIso,
      toCalendarKey(prevRange.startDate),
      toCalendarKey(prevRange.endDate),
    ),
  ])

  const currMonthCalls = monthFunnel.arama
  const prevMonthCalls = prevMonthFunnel.arama
  const trend: HubMonthlyInsights['trend'] =
    currMonthCalls > prevMonthCalls ? 'up' : currMonthCalls < prevMonthCalls ? 'down' : 'flat'

  return {
    dayOfMonth,
    daysInMonth,
    monthPct,
    monthActuals: {
      calls: monthFunnel.arama,
      newCandidates: monthFunnel.tanisma,
      presentations: monthFunnel.sunum,
    },
    prevMonthCalls,
    currMonthCalls,
    trend,
  }
}
