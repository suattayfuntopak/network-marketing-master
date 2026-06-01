'use server'

import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/types/database.types'
import {
  isLibraryComplete,
  itemKeyForProgress,
  progressChangeToEventType,
  type LearningEventType,
  type ProgressChangeType,
} from '@/lib/domain/learningEvents'
import {
  CANONICAL_OBJECTION_COUNT,
  CANONICAL_TRAINING_COUNT,
} from '@/lib/domain/pulse'

type ProgressRow = {
  read_trainings: string[]
  fav_trainings: string[]
  read_objections: number[]
  fav_objections: number[]
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

function parseProgressRow(row: {
  read_trainings?: unknown
  fav_trainings?: unknown
  read_objections?: unknown
  fav_objections?: unknown
} | null): ProgressRow {
  return {
    read_trainings: Array.isArray(row?.read_trainings) ? (row!.read_trainings as string[]) : [],
    fav_trainings: Array.isArray(row?.fav_trainings) ? (row!.fav_trainings as string[]) : [],
    read_objections: Array.isArray(row?.read_objections) ? (row!.read_objections as number[]) : [],
    fav_objections: Array.isArray(row?.fav_objections) ? (row!.fav_objections as number[]) : [],
  }
}

async function maybeRecordLibraryComplete(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
  userId: string,
  eventType: 'training_library_complete' | 'objection_library_complete',
  payload: Record<string, number>
) {
  const { data: existing } = await supabase
    .from('nmm_learning_events')
    .select('id')
    .eq('user_id', userId)
    .eq('event_type', eventType)
    .limit(1)

  if (existing?.length) return

  await supabase.from('nmm_learning_events').insert({
    workspace_id: workspaceId,
    user_id: userId,
    event_type: eventType,
    item_key: null,
    payload,
  })

  await notifySponsorMilestone(supabase, userId, eventType)
}

async function notifySponsorMilestone(
  supabase: Awaited<ReturnType<typeof createClient>>,
  memberUserId: string,
  eventType: 'training_library_complete' | 'objection_library_complete'
) {
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

  const isTraining = eventType === 'training_library_complete'

  await supabase.from('nmm_notifications').insert({
    user_id: leaderId,
    title_tr: isTraining ? 'Ekip üyesi eğitim kütüphanesini tamamladı 🎓' : 'Ekip üyesi itiraz modülünü tamamladı 💬',
    title_en: isTraining ? 'Partner completed training library 🎓' : 'Partner completed objections module 💬',
    description_tr: isTraining
      ? `${memberName}, tüm eğitim içeriklerini okudu olarak işaretlendi.`
      : `${memberName}, tüm itiraz cevaplarını inceledi olarak işaretlendi.`,
    description_en: isTraining
      ? `${memberName} has marked all training topics as read.`
      : `${memberName} has reviewed all objection guides.`,
    type: 'user',
  })
}

export async function recordProgressChangeAction(
  workspaceId: string,
  changeType: ProgressChangeType,
  id: string | number,
  add: boolean
): Promise<void> {
  const { supabase, user } = await assertMember(workspaceId)

  const { data: current } = await supabase
    .from('nmm_user_progress')
    .select('read_trainings, fav_trainings, read_objections, fav_objections')
    .eq('user_id', user.id)
    .maybeSingle()

  const progress = parseProgressRow(current)
  const prevTrainingReads = progress.read_trainings.length
  const prevObjectionReads = progress.read_objections.length

  if (changeType === 'readTraining') {
    const key = String(id)
    if (add) progress.read_trainings = [...new Set([...progress.read_trainings, key])]
    else progress.read_trainings = progress.read_trainings.filter(k => k !== key)
  } else if (changeType === 'favTraining') {
    const key = String(id)
    if (add) progress.fav_trainings = [...new Set([...progress.fav_trainings, key])]
    else progress.fav_trainings = progress.fav_trainings.filter(k => k !== key)
  } else if (changeType === 'readObjection') {
    const num = Number(id)
    if (add) progress.read_objections = [...new Set([...progress.read_objections, num])]
    else progress.read_objections = progress.read_objections.filter(k => k !== num)
  } else if (changeType === 'favObjection') {
    const num = Number(id)
    if (add) progress.fav_objections = [...new Set([...progress.fav_objections, num])]
    else progress.fav_objections = progress.fav_objections.filter(k => k !== num)
  }

  await supabase.from('nmm_user_progress').upsert(
    {
      user_id: user.id,
      workspace_id: workspaceId,
      read_trainings: progress.read_trainings,
      fav_trainings: progress.fav_trainings,
      read_objections: progress.read_objections,
      fav_objections: progress.fav_objections,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )

  const eventType = progressChangeToEventType(changeType, add)
  const itemKey = itemKeyForProgress(changeType, id)

  if (add || eventType.endsWith('_unfav')) {
    await supabase.from('nmm_learning_events').insert({
      workspace_id: workspaceId,
      user_id: user.id,
      event_type: eventType,
      item_key: itemKey,
      payload: {},
    })
  }

  if (
    add &&
    prevTrainingReads < CANONICAL_TRAINING_COUNT &&
    isLibraryComplete(progress.read_trainings.length, 'training')
  ) {
    await maybeRecordLibraryComplete(supabase, workspaceId, user.id, 'training_library_complete', {
      count: progress.read_trainings.length,
      total: CANONICAL_TRAINING_COUNT,
    })
  }

  if (
    add &&
    prevObjectionReads < CANONICAL_OBJECTION_COUNT &&
    isLibraryComplete(progress.read_objections.length, 'objection')
  ) {
    await maybeRecordLibraryComplete(supabase, workspaceId, user.id, 'objection_library_complete', {
      count: progress.read_objections.length,
      total: CANONICAL_OBJECTION_COUNT,
    })
  }
}

export async function logPresentationWhatsAppAction(
  workspaceId: string,
  candidateId: string,
  materialTitle: string
): Promise<void> {
  const { supabase, user } = await assertMember(workspaceId)
  const { buildPresentationWhatsAppActivityFields } = await import('@/lib/domain/dailyActionNote')
  const noteFields = buildPresentationWhatsAppActivityFields(materialTitle)

  await Promise.all([
    supabase
      .from('nmm_candidates')
      .update({ last_contact_at: new Date().toISOString() })
      .eq('id', candidateId),
    supabase.from('nmm_daily_actions').insert({
      workspace_id: workspaceId,
      user_id: user.id,
      candidate_id: candidateId,
      action_type: 'whatsapp',
      ...noteFields,
    }),
  ])

  await logEngagementEventAction(workspaceId, 'presentation_sent', {
    candidate_id: candidateId,
    material_title: materialTitle,
  })
}

export async function logEngagementEventAction(
  workspaceId: string,
  eventType: Extract<
    LearningEventType,
    'presentation_sent' | 'appointment_set' | 'appointment_done'
  >,
  payload: Record<string, unknown> = {}
): Promise<void> {
  const { supabase, user } = await assertMember(workspaceId)

  const candidateId =
    typeof payload.candidate_id === 'string' ? payload.candidate_id : null

  await supabase.from('nmm_learning_events').insert({
    workspace_id: workspaceId,
    user_id: user.id,
    event_type: eventType,
    item_key: candidateId,
    payload: payload as Json,
  })
}
