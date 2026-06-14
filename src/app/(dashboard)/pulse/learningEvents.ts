'use server'

import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/authUser'
import type { ProgressChangeType } from '@/lib/domain/learningEvents'

type ProgressRow = {
  read_trainings: string[]
  fav_trainings: string[]
  read_objections: number[]
  fav_objections: number[]
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
}
