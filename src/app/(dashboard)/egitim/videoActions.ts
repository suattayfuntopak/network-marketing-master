'use server'

import { createClient } from '@/lib/supabase/server'
import {
  CANONICAL_VIDEO_COUNT,
  TRAINING_VIDEOS,
  getTrainingVideoByKey,
  type TrainingVideoDef,
} from '@/lib/domain/trainingVideos'
import {
  summarizeVideoProgress,
  type VideoProgressRow,
  type VideoProgressSummary,
} from '@/lib/domain/videoProgress'

export type VideoProgressMap = Record<string, VideoProgressRow>

export type VideoCatalogPayload = {
  videos: TrainingVideoDef[]
  progressByKey: VideoProgressMap
  summary: VideoProgressSummary
}

async function assertMember(workspaceId: string) {
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

function rowsToMap(rows: VideoProgressRow[]): VideoProgressMap {
  const map: VideoProgressMap = {}
  for (const row of rows) map[row.video_key] = row
  return map
}

export async function getVideoCatalogAction(workspaceId: string): Promise<VideoCatalogPayload> {
  const { supabase, user } = await assertMember(workspaceId)

  const { data: rows } = await supabase
    .from('nmm_video_progress')
    .select('video_key, status, watch_percent, position_sec, duration_sec, started_at, completed_at')
    .eq('user_id', user.id)

  const progressByKey = rowsToMap((rows ?? []) as VideoProgressRow[])
  const keys = TRAINING_VIDEOS.map(v => v.key)
  const summary = summarizeVideoProgress(keys, progressByKey)

  return { videos: TRAINING_VIDEOS, progressByKey, summary }
}

export async function markVideoStartedAction(
  workspaceId: string,
  videoKey: string
): Promise<void> {
  if (!getTrainingVideoByKey(videoKey)) throw new Error('Geçersiz video.')

  const { supabase, user } = await assertMember(workspaceId)
  const video = getTrainingVideoByKey(videoKey)!
  const durationSec = video.durationMin * 60

  const { data: existing } = await supabase
    .from('nmm_video_progress')
    .select('status')
    .eq('user_id', user.id)
    .eq('video_key', videoKey)
    .maybeSingle()

  if (existing?.status === 'completed') return

  await supabase.from('nmm_video_progress').upsert(
    {
      user_id: user.id,
      video_key: videoKey,
      workspace_id: workspaceId,
      status: 'started',
      duration_sec: durationSec,
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,video_key' }
  )
}

export async function markVideoCompletedAction(
  workspaceId: string,
  videoKey: string
): Promise<void> {
  if (!getTrainingVideoByKey(videoKey)) throw new Error('Geçersiz video.')

  const { supabase, user } = await assertMember(workspaceId)
  const video = getTrainingVideoByKey(videoKey)!
  const durationSec = video.durationMin * 60
  const now = new Date().toISOString()

  const { data: priorRows } = await supabase
    .from('nmm_video_progress')
    .select('video_key, status')
    .eq('user_id', user.id)

  const completedBefore =
    (priorRows ?? []).filter(
      r => r.status === 'completed' && r.video_key !== videoKey
    ).length

  await supabase.from('nmm_video_progress').upsert(
    {
      user_id: user.id,
      video_key: videoKey,
      workspace_id: workspaceId,
      status: 'completed',
      watch_percent: 100,
      position_sec: durationSec,
      duration_sec: durationSec,
      completed_at: now,
      updated_at: now,
    },
    { onConflict: 'user_id,video_key' }
  )

  if (completedBefore === CANONICAL_VIDEO_COUNT - 1) {
    await maybeNotifyAllVideosComplete(supabase, user.id)
  }
}

export async function updateVideoWatchPercentAction(
  workspaceId: string,
  videoKey: string,
  watchPercent: number
): Promise<void> {
  if (!getTrainingVideoByKey(videoKey)) throw new Error('Geçersiz video.')
  const pct = Math.max(0, Math.min(100, Math.round(watchPercent)))

  const { supabase, user } = await assertMember(workspaceId)
  const video = getTrainingVideoByKey(videoKey)!
  const durationSec = video.durationMin * 60
  const positionSec = Math.round((durationSec * pct) / 100)
  const now = new Date().toISOString()
  const completed = pct >= 90

  await supabase.from('nmm_video_progress').upsert(
    {
      user_id: user.id,
      video_key: videoKey,
      workspace_id: workspaceId,
      status: completed ? 'completed' : 'started',
      watch_percent: pct,
      position_sec: positionSec,
      duration_sec: durationSec,
      completed_at: completed ? now : null,
      updated_at: now,
    },
    { onConflict: 'user_id,video_key' }
  )
}

async function maybeNotifyAllVideosComplete(
  supabase: Awaited<ReturnType<typeof createClient>>,
  memberUserId: string
) {
  const { count } = await supabase
    .from('nmm_video_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', memberUserId)
    .eq('status', 'completed')

  if ((count ?? 0) < CANONICAL_VIDEO_COUNT) return

  const { data: member } = await supabase
    .from('nmm_workspace_members')
    .select('full_name')
    .eq('user_id', memberUserId)
    .limit(1)
    .maybeSingle()

  const memberName = member?.full_name ?? 'Ekip üyesi'

  const { data: sponsorWs } = await supabase
    .from('nmm_workspaces')
    .select('parent_id')
    .eq('owner_id', memberUserId)
    .maybeSingle()

  const leaderId = sponsorWs?.parent_id
  if (!leaderId || leaderId === memberUserId) return

  await supabase.from('nmm_notifications').insert({
    user_id: leaderId,
    title_tr: 'Ekip üyesi video eğitimlerini tamamladı 🎬',
    title_en: 'Partner completed video training 🎬',
    description_tr: `${memberName}, tüm video modüllerini tamamladı.`,
    description_en: `${memberName} completed all video modules.`,
    type: 'user',
  })
}

export async function getTeamVideoSummaryMapAction(
  memberUserIds: string[]
): Promise<Record<string, VideoProgressSummary>> {
  if (memberUserIds.length === 0) return {}

  const supabase = await createClient()
  const keys = TRAINING_VIDEOS.map(v => v.key)
  const uniqueIds = [...new Set(memberUserIds.filter(Boolean))]

  const { data: rows } = await supabase
    .from('nmm_video_progress')
    .select('user_id, video_key, status, watch_percent')
    .in('user_id', uniqueIds)

  const byUser: Record<string, VideoProgressMap> = {}
  for (const uid of uniqueIds) byUser[uid] = {}

  for (const row of rows ?? []) {
    if (!byUser[row.user_id]) byUser[row.user_id] = {}
    byUser[row.user_id][row.video_key] = row as VideoProgressRow
  }

  const result: Record<string, VideoProgressSummary> = {}
  for (const uid of uniqueIds) {
    result[uid] = summarizeVideoProgress(keys, byUser[uid] ?? {})
  }
  return result
}
