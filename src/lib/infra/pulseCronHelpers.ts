import { createAdminClient, type AdminClient } from '@/lib/supabase/admin'
import { isSuperAdmin } from '@/lib/domain/auth'
import { hasTeamPulseAccess } from '@/lib/domain/teamAccess'
import {
  parseDailyMetrics,
  upsertPulseDailyRollup,
  weekDayKeys,
  type PulseDailyMetrics,
} from '@/lib/domain/pulseRollup'
import {
  aggregateRollupRows,
  generatePulseWeeklyInsight,
} from '@/lib/infra/pulseWeeklyAi'
import {
  computeAttentionFlags,
  parseLearningProgress,
} from '@/lib/domain/pulse'
import { summarizeVideoProgress } from '@/lib/domain/videoProgress'
import { TRAINING_VIDEOS } from '@/lib/domain/trainingVideos'
import { previousWeekStartKey } from '@/lib/domain/pulseRollup'
import { yesterdayCalendarKey } from '@/lib/utils/calendarDates'

export async function fetchActiveWorkspaces(supabase: AdminClient) {
  const now = new Date()
  const { data, error } = await supabase
    .from('nmm_workspaces')
    .select('id, owner_id, license_type, license_expires_at, parent_id')

  if (error) throw error

  return (data ?? []).filter(
    ws =>
      ws.owner_id &&
      !(ws.license_expires_at && new Date(ws.license_expires_at) < now)
  )
}

export async function runDailyPulseRollup(dayKey: string) {
  const supabase = createAdminClient()
  const workspaces = await fetchActiveWorkspaces(supabase)
  let upserted = 0

  for (const ws of workspaces) {
    if (!ws.owner_id) continue
    await upsertPulseDailyRollup(supabase, ws.id, ws.owner_id, dayKey)
    upserted++
  }

  return { dayKey, upserted }
}

async function fetchWeekRollup(
  supabase: AdminClient,
  userId: string,
  weekStart: string
): Promise<PulseDailyMetrics> {
  const days = weekDayKeys(weekStart)
  const { data } = await supabase
    .from('nmm_team_pulse_daily')
    .select('day, metrics')
    .eq('user_id', userId)
    .in('day', days)

  if (!data?.length) return parseDailyMetrics({})
  return aggregateRollupRows(data)
}

async function buildPersonalContext(
  supabase: AdminClient,
  workspaceId: string,
  userId: string,
  weekTotals: PulseDailyMetrics
) {
  const { data: progress } = await supabase
    .from('nmm_user_progress')
    .select('read_trainings, fav_trainings, read_objections, fav_objections')
    .eq('user_id', userId)
    .maybeSingle()

  const learning = parseLearningProgress(progress)
  const { data: videos } = await supabase
    .from('nmm_video_progress')
    .select('video_key, status, watch_percent')
    .eq('user_id', userId)

  const videoByKey: Record<string, { status: 'started' | 'completed'; watch_percent: number }> =
    {}
  for (const v of videos ?? []) {
    videoByKey[v.video_key] = {
      status: v.status as 'started' | 'completed',
      watch_percent: v.watch_percent ?? 0,
    }
  }
  const video = summarizeVideoProgress(TRAINING_VIDEOS.map(t => t.key), videoByKey)

  return JSON.stringify({
    weekTotals,
    allTime: {
      trainingPct: learning.trainingPct,
      objectionPct: learning.objectionPct,
      videoPct: video.pct,
      videoDropoff: video.startedIncomplete,
    },
  })
}

async function buildTeamContext(
  supabase: AdminClient,
  leaderUserId: string,
  weekStart: string
) {
  const { data: downline } = await supabase
    .from('nmm_workspaces')
    .select('id, owner_id')
    .eq('parent_id', leaderUserId)

  const members: Record<string, unknown>[] = []

  for (const dl of downline ?? []) {
    if (!dl.owner_id) continue
    const weekTotals = await fetchWeekRollup(supabase, dl.owner_id, weekStart)

    const { data: progress } = await supabase
      .from('nmm_user_progress')
      .select('read_trainings, read_objections')
      .eq('user_id', dl.owner_id)
      .maybeSingle()

    const { data: member } = await supabase
      .from('nmm_workspace_members')
      .select('full_name, joined_at')
      .eq('user_id', dl.owner_id)
      .limit(1)
      .maybeSingle()

    const { data: lastAction } = await supabase
      .from('nmm_daily_actions')
      .select('created_at')
      .eq('user_id', dl.owner_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const { data: onboarding } = await supabase
      .from('nmm_onboarding_progress')
      .select('step_id')
      .eq('user_id', dl.owner_id)

    const learning = parseLearningProgress(progress)
    const flags = computeAttentionFlags({
      trainingPct: learning.trainingPct,
      objectionPct: learning.objectionPct,
      onboardingSteps: onboarding?.map(o => o.step_id) ?? [],
      lastActivityAt: lastAction?.created_at ?? null,
      joinedAt: member?.joined_at ?? null,
    })

    members.push({
      name: member?.full_name ?? 'Partner',
      weekTotals,
      trainingPct: learning.trainingPct,
      objectionPct: learning.objectionPct,
      flags,
    })
  }

  return JSON.stringify({ downlineCount: members.length, members })
}

async function backfillWeekRollups(
  supabase: AdminClient,
  workspaces: Awaited<ReturnType<typeof fetchActiveWorkspaces>>,
  weekStart: string
) {
  const days = weekDayKeys(weekStart)
  const { data: downlineWs } = await supabase
    .from('nmm_workspaces')
    .select('id, owner_id')
    .not('parent_id', 'is', null)

  for (const day of days) {
    for (const ws of workspaces) {
      if (!ws.owner_id) continue
      await upsertPulseDailyRollup(supabase, ws.id, ws.owner_id, day)
    }
    for (const dl of downlineWs ?? []) {
      if (!dl.owner_id) continue
      await upsertPulseDailyRollup(supabase, dl.id, dl.owner_id, day)
    }
  }
}

export async function runWeeklyPulseAi(weekStart: string) {
  const supabase = createAdminClient()
  const workspaces = await fetchActiveWorkspaces(supabase)
  await backfillWeekRollups(supabase, workspaces, weekStart)
  let generated = 0

  for (const ws of workspaces) {
    if (!ws.owner_id) continue

    const weekTotals = await fetchWeekRollup(supabase, ws.owner_id, weekStart)
    const personalCtx = await buildPersonalContext(
      supabase,
      ws.id,
      ws.owner_id,
      weekTotals
    )

    const personalAi = await generatePulseWeeklyInsight({
      scope: 'personal',
      weekStart,
      weekTotals,
      contextJson: personalCtx,
    })

    if (personalAi) {
      await supabase.from('nmm_pulse_weekly_summaries').upsert(
        {
          user_id: ws.owner_id,
          workspace_id: ws.id,
          scope: 'personal',
          week_start: weekStart,
          summary_tr: personalAi.summary_tr,
          summary_en: personalAi.summary_en,
          bullets_tr: personalAi.bullets_tr,
          bullets_en: personalAi.bullets_en,
          risk_flags: personalAi.risk_flags,
          model: 'gemini-2.5-flash',
        },
        { onConflict: 'user_id,workspace_id,scope,week_start' }
      )
      generated++
    }

    const { data: ownerAuth } = await supabase.auth.admin.getUserById(ws.owner_id)
    const isSa = isSuperAdmin(ownerAuth?.user ?? null)

    if (!hasTeamPulseAccess(ws.license_type, isSa)) continue

    const teamWeekTotals = await fetchWeekRollup(supabase, ws.owner_id, weekStart)
    const teamCtx = await buildTeamContext(supabase, ws.owner_id, weekStart)
    const { data: leaderMember } = await supabase
      .from('nmm_workspace_members')
      .select('full_name')
      .eq('user_id', ws.owner_id)
      .limit(1)
      .maybeSingle()

    const teamAi = await generatePulseWeeklyInsight({
      scope: 'team',
      leaderName: leaderMember?.full_name ?? undefined,
      weekStart,
      weekTotals: teamWeekTotals,
      contextJson: teamCtx,
    })

    if (teamAi) {
      await supabase.from('nmm_pulse_weekly_summaries').upsert(
        {
          user_id: ws.owner_id,
          workspace_id: ws.id,
          scope: 'team',
          week_start: weekStart,
          summary_tr: teamAi.summary_tr,
          summary_en: teamAi.summary_en,
          bullets_tr: teamAi.bullets_tr,
          bullets_en: teamAi.bullets_en,
          risk_flags: teamAi.risk_flags,
          model: 'gemini-2.5-flash',
        },
        { onConflict: 'user_id,workspace_id,scope,week_start' }
      )
      generated++
    }
  }

  return { weekStart, generated }
}

export function defaultRollupDayKey(): string {
  return yesterdayCalendarKey()
}

export function defaultWeeklyWeekStart(): string {
  return previousWeekStartKey(yesterdayCalendarKey())
}
