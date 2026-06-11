'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthUser } from '@/lib/supabase/authUser'
import { assertSuperAdmin, isSuperAdmin } from '@/lib/domain/auth'
import { sendModerationAlertEmail } from '@/lib/infra/mail'
import { type TrainingVideoDef } from '@/lib/domain/trainingVideos'
import {
  summarizeVideoProgress,
  type VideoProgressRow,
  type VideoProgressSummary,
} from '@/lib/domain/videoProgress'
import { extractYoutubeId } from '@/lib/utils/youtubeId'

export type VideoProgressMap = Record<string, VideoProgressRow>

/** DB satırı + id/sortOrder ile zenginleştirilmiş video tanımı (admin düzenleme için). */
export type TrainingVideoAdmin = TrainingVideoDef & { id: string; sortOrder: number }

export type VideoCatalogPayload = {
  videos: TrainingVideoAdmin[]
  progressByKey: VideoProgressMap
  summary: VideoProgressSummary
}

type VideoRow = {
  id: string
  key: string
  youtube_id: string
  title_tr: string
  title_en: string
  description_tr: string
  description_en: string
  duration_min: number
  category_tr: string
  category_en: string
  related_training_id: string | null
  sort_order: number
}

const VIDEO_COLS =
  'id, key, youtube_id, title_tr, title_en, description_tr, description_en, duration_min, category_tr, category_en, related_training_id, sort_order'

function rowToDef(r: VideoRow): TrainingVideoAdmin {
  return {
    id: r.id,
    key: r.key,
    youtubeId: r.youtube_id,
    titleTr: r.title_tr,
    titleEn: r.title_en,
    descriptionTr: r.description_tr,
    descriptionEn: r.description_en,
    durationMin: r.duration_min,
    categoryTr: r.category_tr,
    categoryEn: r.category_en,
    relatedTrainingId: r.related_training_id ?? undefined,
    sortOrder: r.sort_order,
  }
}

async function assertMember(workspaceId: string) {
  const supabase = await createClient()
  const { user } = await getAuthUser()
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

/** Public video kataloğu (sort_order'a göre) — sayfa + admin için. */
export async function getTrainingVideosAction(): Promise<TrainingVideoAdmin[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('nmm_training_videos')
    .select(VIDEO_COLS)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  return ((data ?? []) as VideoRow[]).map(rowToDef)
}

async function fetchVideoByKey(
  supabase: Awaited<ReturnType<typeof createClient>>,
  key: string
): Promise<VideoRow | null> {
  const { data } = await supabase
    .from('nmm_training_videos')
    .select(VIDEO_COLS)
    .eq('key', key)
    .maybeSingle()
  return (data as VideoRow | null) ?? null
}

async function countVideos(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<number> {
  const { count } = await supabase
    .from('nmm_training_videos')
    .select('id', { count: 'exact', head: true })
  return count ?? 0
}

export async function getVideoCatalogAction(workspaceId: string): Promise<VideoCatalogPayload> {
  const { supabase, user } = await assertMember(workspaceId)

  const [{ data: videoRows }, { data: rows }] = await Promise.all([
    supabase
      .from('nmm_training_videos')
      .select(VIDEO_COLS)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase
      .from('nmm_video_progress')
      .select('video_key, status, watch_percent, position_sec, duration_sec, started_at, completed_at')
      .eq('user_id', user.id),
  ])

  const videos = ((videoRows ?? []) as VideoRow[]).map(rowToDef)
  const progressByKey = rowsToMap((rows ?? []) as VideoProgressRow[])
  const keys = videos.map(v => v.key)
  const summary = summarizeVideoProgress(keys, progressByKey)

  return { videos, progressByKey, summary }
}

export async function markVideoStartedAction(
  workspaceId: string,
  videoKey: string
): Promise<void> {
  const { supabase, user } = await assertMember(workspaceId)
  const video = await fetchVideoByKey(supabase, videoKey)
  if (!video) throw new Error('Geçersiz video.')
  const durationSec = video.duration_min * 60

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
  const { supabase, user } = await assertMember(workspaceId)
  const video = await fetchVideoByKey(supabase, videoKey)
  if (!video) throw new Error('Geçersiz video.')
  const durationSec = video.duration_min * 60
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

  const total = await countVideos(supabase)
  if (total > 0 && completedBefore === total - 1) {
    await maybeNotifyAllVideosComplete(supabase, user.id, total)
  }
}

export async function updateVideoWatchPercentAction(
  workspaceId: string,
  videoKey: string,
  watchPercent: number
): Promise<void> {
  const pct = Math.max(0, Math.min(100, Math.round(watchPercent)))

  const { supabase, user } = await assertMember(workspaceId)
  const video = await fetchVideoByKey(supabase, videoKey)
  if (!video) throw new Error('Geçersiz video.')
  const durationSec = video.duration_min * 60
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
  memberUserId: string,
  totalVideos: number
) {
  const { count } = await supabase
    .from('nmm_video_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', memberUserId)
    .eq('status', 'completed')

  if ((count ?? 0) < totalVideos) return

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

  let leaderId: string | null = null
  if (sponsorWs?.parent_id) {
    const { data: parentWs } = await supabase
      .from('nmm_workspaces')
      .select('owner_id')
      .eq('id', sponsorWs.parent_id)
      .maybeSingle()
    leaderId = parentWs?.owner_id ?? null
  }
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
  const { data: vids } = await supabase.from('nmm_training_videos').select('key')
  const keys = ((vids ?? []) as { key: string }[]).map(v => v.key)
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

// ───────────────────────── Super Admin CRUD ─────────────────────────

export type VideoInput = {
  youtubeUrlOrId: string
  titleTr: string
  titleEn: string
  descriptionTr: string
  descriptionEn: string
  durationMin: number
  categoryTr: string
  categoryEn: string
  relatedTrainingId?: string | null
  sortOrder?: number
}

async function assertAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  assertSuperAdmin(user)
  return createAdminClient()
}

export async function createTrainingVideoAction(
  workspaceId: string,
  input: VideoInput,
): Promise<{ success: boolean; isApproved: boolean }> {
  const { user } = await assertMember(workspaceId)
  const youtubeId = extractYoutubeId(input.youtubeUrlOrId)
  if (!youtubeId) throw new Error('Geçerli bir YouTube video bağlantısı/ID girin.')
  if (!input.titleTr.trim()) throw new Error('Başlık (TR) gerekli.')

  const admin = createAdminClient()
  const isApproved = isSuperAdmin(user)
  const userEmail = user.email ?? ''
  const userName = (user.user_metadata?.full_name as string) ?? user.email?.split('@')[0] ?? 'NMM Üyesi'
  const key = `vid-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

  const { error } = await admin.from('nmm_training_videos').insert({
    key,
    youtube_id: youtubeId,
    title_tr: input.titleTr.trim(),
    title_en: (input.titleEn || input.titleTr).trim(),
    description_tr: input.descriptionTr.trim(),
    description_en: input.descriptionEn.trim(),
    duration_min: Math.max(1, Math.round(input.durationMin || 10)),
    category_tr: input.categoryTr.trim(),
    category_en: input.categoryEn.trim(),
    related_training_id: input.relatedTrainingId || null,
    sort_order: input.sortOrder ?? 999,
    is_approved: isApproved,
    user_id: user.id,
    workspace_id: workspaceId,
    user_email: userEmail,
    user_name: userName,
  })
  if (error) throw new Error('Video eklenemedi: ' + error.message)

  if (!isApproved) {
    sendModerationAlertEmail(userEmail, userName, 'video', input.titleTr.trim()).catch(err => {
      console.error('[Resend Alert Error]', err)
    })
  }

  return { success: true, isApproved }
}

export async function updateTrainingVideoAction(id: string, input: VideoInput): Promise<void> {
  const admin = await assertAdmin()
  const youtubeId = extractYoutubeId(input.youtubeUrlOrId)
  if (!youtubeId) throw new Error('Geçerli bir YouTube video bağlantısı/ID girin.')
  if (!input.titleTr.trim()) throw new Error('Başlık (TR) gerekli.')

  const { error } = await admin
    .from('nmm_training_videos')
    .update({
      youtube_id: youtubeId,
      title_tr: input.titleTr.trim(),
      title_en: (input.titleEn || input.titleTr).trim(),
      description_tr: input.descriptionTr.trim(),
      description_en: input.descriptionEn.trim(),
      duration_min: Math.max(1, Math.round(input.durationMin || 10)),
      category_tr: input.categoryTr.trim(),
      category_en: input.categoryEn.trim(),
      related_training_id: input.relatedTrainingId || null,
      sort_order: input.sortOrder ?? 999,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw new Error('Video güncellenemedi: ' + error.message)
}

export async function deleteTrainingVideoAction(id: string): Promise<void> {
  const admin = await assertAdmin()
  const { error } = await admin.from('nmm_training_videos').delete().eq('id', id)
  if (error) throw new Error('Video silinemedi: ' + error.message)
}
