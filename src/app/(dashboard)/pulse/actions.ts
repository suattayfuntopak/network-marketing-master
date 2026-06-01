'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { listAllAuthUsers } from '@/lib/supabase/listAllAuthUsers'
import { assertSuperAdmin, isSuperAdmin } from '@/lib/domain/auth'
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

export type PulseSummaryResult = {
  data: MyPulseSummary
  warning: string | null
}

export async function getMyPulseSummaryAction(
  workspaceId: string,
  period: PulsePeriod
): Promise<PulseSummaryResult> {
  try {
    const data = await buildMyPulseSummary(workspaceId, period)
    return { data, warning: null }
  } catch (err) {
    console.error('[getMyPulseSummary]', err)
    return { data: emptyMyPulseSummary(period), warning: 'load_failed' }
  }
}

export type IndependentOwnerPulseRow = {
  userId: string
  workspaceId: string
  fullName: string | null
  email: string
  trainingPct: number
  objectionPct: number
  onboardingDone: number
  videoPct: number
  newCandidates: number
  calls: number
}

/** Super-admin: bağımsız dış kayıtların kişi bazlı nabız özeti (admin okuma). */
export async function getIndependentOwnersPulseAction(): Promise<{
  rows: IndependentOwnerPulseRow[]
  warning: string | null
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    assertSuperAdmin(user)
    const admin = createAdminClient()

    const { data: myMembership } = await supabase
      .from('nmm_workspace_members')
      .select('workspace_id')
      .eq('user_id', user!.id)
      .eq('role', 'leader')
      .maybeSingle()

    const excludeWorkspaceId = myMembership?.workspace_id ?? null

    const { data: workspaces, error: wsError } = await admin
      .from('nmm_workspaces')
      .select('id, owner_id, license_type, parent_id')
      .is('parent_id', null)
      .order('created_at', { ascending: true })

    if (wsError || !workspaces) {
      return { rows: [], warning: 'load_failed' }
    }

    const seen = new Set<string>()
    const targets: { userId: string; workspaceId: string }[] = []
    for (const ws of workspaces) {
      if (ws.id === excludeWorkspaceId || !ws.owner_id || ws.owner_id === user!.id) continue
      if (ws.parent_id) continue
      if (seen.has(ws.owner_id)) continue
      seen.add(ws.owner_id)
      targets.push({ userId: ws.owner_id, workspaceId: ws.id })
    }

    if (targets.length === 0) return { rows: [], warning: null }

    const users = await listAllAuthUsers(admin)
    const userMap = new Map(users.map(u => [u.id, u]))
    const ownerIds = targets.map(t => t.userId)

    const { data: progressRows } = await admin
      .from('nmm_user_progress')
      .select('user_id, read_trainings, read_objections, fav_trainings, fav_objections')
      .in('user_id', ownerIds)

    const progressByUser = new Map((progressRows ?? []).map(r => [r.user_id, r]))

    const { data: onboardingRows } = await admin
      .from('nmm_onboarding_progress')
      .select('user_id')
      .in('user_id', ownerIds)

    const onboardingCount = new Map<string, number>()
    onboardingRows?.forEach(r => {
      onboardingCount.set(r.user_id, (onboardingCount.get(r.user_id) ?? 0) + 1)
    })

    const since = periodStartIso('30d')
    let actionsQuery = admin
      .from('nmm_daily_actions')
      .select('user_id, action_type')
      .in('user_id', ownerIds)
    if (since) actionsQuery = actionsQuery.gte('created_at', since)

    const { data: actions } = await actionsQuery
    const callsByUser = new Map<string, number>()
    actions?.forEach(a => {
      if (a.action_type === 'call') {
        callsByUser.set(a.user_id, (callsByUser.get(a.user_id) ?? 0) + 1)
      }
    })

    let candQuery = admin
      .from('nmm_candidates')
      .select('owner_id')
      .in('owner_id', ownerIds)
    if (since) candQuery = candQuery.gte('created_at', since)
    const { data: cands } = await candQuery
    const candByOwner = new Map<string, number>()
    cands?.forEach(c => {
      if (c.owner_id) candByOwner.set(c.owner_id, (candByOwner.get(c.owner_id) ?? 0) + 1)
    })

    const { data: videoRows } = await admin
      .from('nmm_video_progress')
      .select('user_id, video_key, status, watch_percent')
      .in('user_id', ownerIds)

    const videoByUser = new Map<string, Record<string, { status: 'started' | 'completed'; watch_percent: number }>>()
    for (const row of videoRows ?? []) {
      const map = videoByUser.get(row.user_id) ?? {}
      map[row.video_key] = {
        status: row.status as 'started' | 'completed',
        watch_percent: row.watch_percent ?? 0,
      }
      videoByUser.set(row.user_id, map)
    }

    const rows: IndependentOwnerPulseRow[] = targets.map(t => {
      const authUser = userMap.get(t.userId)
      const email = authUser?.email ?? '—'
      const fullName =
        (authUser?.user_metadata?.full_name as string | undefined) ??
        email.split('@')[0] ??
        null
      const learning = parseLearningProgress(progressByUser.get(t.userId) ?? null)
      const video = summarizeVideoProgress(
        TRAINING_VIDEOS.map(v => v.key),
        videoByUser.get(t.userId) ?? {}
      )
      return {
        userId: t.userId,
        workspaceId: t.workspaceId,
        fullName,
        email,
        trainingPct: learning.trainingPct,
        objectionPct: learning.objectionPct,
        onboardingDone: onboardingCount.get(t.userId) ?? 0,
        videoPct: video.pct,
        newCandidates: candByOwner.get(t.userId) ?? 0,
        calls: callsByUser.get(t.userId) ?? 0,
      }
    })

    return { rows, warning: null }
  } catch (err) {
    console.error('[getIndependentOwnersPulse]', err)
    return { rows: [], warning: 'load_failed' }
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
