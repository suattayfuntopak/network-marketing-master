'use server'

import { createClient } from '@/lib/supabase/server'
import { isSuperAdmin } from '@/lib/domain/auth'
import {
  ONBOARDING_STEP_COUNT,
  emptyMyPulseSummary,
  parseLearningProgress,
  periodStartIso,
  computeLearningStreak,
  countDistinctReadsInPeriod,
  type FieldEngagementSummary,
  type LearningProgressSummary,
  type PeriodLearningSummary,
  type PulsePeriod,
} from '@/lib/domain/pulse'
import { hasTeamPulseAccess } from '@/lib/domain/teamAccess'
import { TRAINING_VIDEOS } from '@/lib/domain/trainingVideos'
import {
  summarizeVideoProgress,
  videoDropoffCount,
  type VideoProgressSummary,
} from '@/lib/domain/videoProgress'
import { getTeamVideoSummaryMapAction } from '@/app/(dashboard)/egitim/videoActions'

export type MyPulseSummary = {
  learning: LearningProgressSummary
  periodLearning: PeriodLearningSummary | null
  onboardingDone: number
  field: FieldEngagementSummary
  streakDays: number
  video: VideoProgressSummary
  videoDropoff: number
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

function countEngagement(
  events: { event_type: string }[]
): Pick<FieldEngagementSummary, 'presentationsSent' | 'appointmentsSet' | 'appointmentsDone'> {
  return {
    presentationsSent: events.filter(e => e.event_type === 'presentation_sent').length,
    appointmentsSet: events.filter(e => e.event_type === 'appointment_set').length,
    appointmentsDone: events.filter(e => e.event_type === 'appointment_done').length,
  }
}

export async function getMyPulseSummaryAction(
  workspaceId: string,
  period: PulsePeriod
): Promise<MyPulseSummary> {
  try {
    return await buildMyPulseSummary(workspaceId, period)
  } catch (err) {
    console.error('[getMyPulseSummary]', err)
    return emptyMyPulseSummary(period)
  }
}

async function buildMyPulseSummary(
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

  let eventsQuery = supabase
    .from('nmm_learning_events')
    .select('event_type, item_key, created_at')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)

  if (since) eventsQuery = eventsQuery.gte('created_at', since)

  const { data: periodEvents } = await eventsQuery

  const engagement = countEngagement(periodEvents ?? [])

  let streakQuery = supabase
    .from('nmm_learning_events')
    .select('event_type, created_at')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .in('event_type', ['training_read', 'objection_read'])
    .order('created_at', { ascending: false })
    .limit(400)

  const streakStart = new Date()
  streakStart.setDate(streakStart.getDate() - 120)
  streakQuery = streakQuery.gte('created_at', streakStart.toISOString())

  const { data: streakEvents } = await streakQuery

  const periodLearning =
    period === 'all' ? null : countDistinctReadsInPeriod(periodEvents ?? [])

  const { data: videoRows } = await supabase
    .from('nmm_video_progress')
    .select('video_key, status, watch_percent')
    .eq('user_id', user.id)

  const videoByKey: Record<string, { status: 'started' | 'completed'; watch_percent: number }> =
    {}
  for (const row of videoRows ?? []) {
    videoByKey[row.video_key] = {
      status: row.status as 'started' | 'completed',
      watch_percent: row.watch_percent ?? 0,
    }
  }
  const video = summarizeVideoProgress(
    TRAINING_VIDEOS.map(v => v.key),
    videoByKey
  )

  return {
    learning: parseLearningProgress(progress),
    periodLearning,
    onboardingDone: onboardingDone ?? 0,
    field: {
      newCandidates: newCandidates ?? 0,
      calls,
      whatsapps,
      ...engagement,
    },
    streakDays: computeLearningStreak(streakEvents ?? []),
    video,
    videoDropoff: videoDropoffCount(video),
  }
}

export type TeamProgressMap = Record<string, LearningProgressSummary>

export type TeamEngagementMap = Record<
  string,
  {
    presentationsSent: number
    appointmentsSet: number
    appointmentsDone: number
  }
>

export async function getTeamProgressMapAction(
  workspaceId: string,
  memberUserIds: string[],
  period: PulsePeriod = '30d'
): Promise<{
  locked: boolean
  progressByUserId: TeamProgressMap
  engagementByUserId: TeamEngagementMap
  videoByUserId: Record<string, VideoProgressSummary>
}> {
  const { supabase, user } = await assertWorkspaceMember(workspaceId)

  const { data: ws } = await supabase
    .from('nmm_workspaces')
    .select('license_type, owner_id')
    .eq('id', workspaceId)
    .single()

  const admin = isSuperAdmin(user)
  const locked = !hasTeamPulseAccess(ws?.license_type, admin)

  if (locked || memberUserIds.length === 0) {
    return { locked, progressByUserId: {}, engagementByUserId: {}, videoByUserId: {} }
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

  const since = periodStartIso(period)
  let eventsQuery = supabase
    .from('nmm_learning_events')
    .select('user_id, event_type')
    .in('user_id', uniqueIds)
    .in('event_type', ['presentation_sent', 'appointment_set', 'appointment_done'])

  if (since) eventsQuery = eventsQuery.gte('created_at', since)

  const { data: engagementRows } = await eventsQuery

  const engagementByUserId: TeamEngagementMap = {}
  for (const uid of uniqueIds) {
    engagementByUserId[uid] = {
      presentationsSent: 0,
      appointmentsSet: 0,
      appointmentsDone: 0,
    }
  }
  for (const row of engagementRows ?? []) {
    const bucket = engagementByUserId[row.user_id]
    if (!bucket) continue
    if (row.event_type === 'presentation_sent') bucket.presentationsSent++
    if (row.event_type === 'appointment_set') bucket.appointmentsSet++
    if (row.event_type === 'appointment_done') bucket.appointmentsDone++
  }

  const videoByUserId = await getTeamVideoSummaryMapAction(uniqueIds)

  return { locked: false, progressByUserId, engagementByUserId, videoByUserId }
}

export { ONBOARDING_STEP_COUNT }
