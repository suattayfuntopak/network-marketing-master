'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuthUserId } from '@/lib/supabase/requireAuth'
import { CANDIDATE_DETAIL_SELECT, CANDIDATE_LIST_SELECT } from '@/lib/domain/candidateSelect'
import { resolveCandidateFields } from '@/lib/domain/candidateFields'
import { buildDailyActionNoteFields } from '@/lib/domain/dailyActionNote'
import { translateNoteAction } from '@/app/(dashboard)/pipeline/[id]/actions'
import type {
  ActionType,
  NmmCandidate,
  NmmCandidateInsert,
  NmmCandidateUpdate,
  NmmDailyAction,
  NmmDailyActionInsert,
} from '@/types/database.types'

async function assertWorkspaceMembership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
  userId: string,
) {
  const { count, error } = await supabase
    .from('nmm_workspace_members')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
  if ((count ?? 0) === 0) throw new Error('Workspace erişimi bulunamadı.')
}

async function getOwnedCandidate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
  candidateId: string,
  userId: string,
): Promise<NmmCandidate> {
  const { data, error } = await supabase
    .from('nmm_candidates')
    .select(CANDIDATE_DETAIL_SELECT)
    .eq('id', candidateId)
    .eq('workspace_id', workspaceId)
    .eq('owner_id', userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('Aday bulunamadı.')
  return data as NmmCandidate
}

/** Workspace aday listesi — dashboard SSR prefetch ve useCandidates ile paylaşılır. */
export async function fetchCandidatesAction(workspaceId: string): Promise<NmmCandidate[]> {
  return fetchAllCandidatesAction(workspaceId)
}

/** Tüm sayfaları sırayla çeker — büyük workspace'ler için. */
export async function fetchAllCandidatesAction(workspaceId: string): Promise<NmmCandidate[]> {
  const all: NmmCandidate[] = []
  let cursor: string | undefined
  do {
    const page = await fetchCandidatesPageAction(workspaceId, cursor)
    all.push(...page.rows)
    cursor = page.nextCursor ?? undefined
  } while (cursor)
  return all
}

/**
 * Cursor-based sayfalama — Kanban yerine düz liste kullanan görünümler için.
 * cursor = önceki sayfanın son satırının updated_at ISO string'i.
 */
export async function fetchCandidatesPageAction(
  workspaceId: string,
  cursor?: string,
): Promise<{ rows: NmmCandidate[]; hasMore: boolean; nextCursor: string | null }> {
  const PAGE = 50
  const supabase = await createClient()
  const userId = await requireAuthUserId()

  let query = supabase
    .from('nmm_candidates')
    .select(CANDIDATE_LIST_SELECT)
    .eq('workspace_id', workspaceId)
    .eq('owner_id', userId)
    .order('updated_at', { ascending: false })
    .limit(PAGE + 1)

  if (cursor) query = query.lt('updated_at', cursor)

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const rows = (data ?? []) as NmmCandidate[]
  const hasMore = rows.length > PAGE
  if (hasMore) rows.pop()

  return {
    rows,
    hasMore,
    nextCursor: hasMore ? rows[rows.length - 1].updated_at : null,
  }
}

/** Pipeline detay — tek aday, tam satır. */
export async function fetchCandidateDetailAction(
  workspaceId: string,
  candidateId: string
): Promise<NmmCandidate | null> {
  const supabase = await createClient()
  const userId = await requireAuthUserId()

  const { data, error } = await supabase
    .from('nmm_candidates')
    .select(CANDIDATE_DETAIL_SELECT)
    .eq('id', candidateId)
    .eq('workspace_id', workspaceId)
    .eq('owner_id', userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

export async function addCandidateAction(
  workspaceId: string,
  payload: Omit<NmmCandidateInsert, 'workspace_id' | 'owner_id'>
): Promise<{ candidateId: string }> {
  const supabase = await createClient()
  const userId = await requireAuthUserId()
  await assertWorkspaceMembership(supabase, workspaceId, userId)

  const { data, error } = await supabase
    .from('nmm_candidates')
    .insert({
      ...payload,
      workspace_id: workspaceId,
      owner_id: userId,
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  const { error: actionError } = await supabase
    .from('nmm_daily_actions')
    .insert({
      workspace_id: workspaceId,
      user_id: userId,
      candidate_id: data.id,
      action_type: 'note',
      note: 'system_note:candidate_created',
    })

  if (actionError) throw new Error(actionError.message)
  return { candidateId: data.id }
}

export async function updateCandidateAction(
  workspaceId: string,
  candidateId: string,
  patch: NmmCandidateUpdate
): Promise<void> {
  const supabase = await createClient()
  const userId = await requireAuthUserId()
  const currentCandidate = await getOwnedCandidate(supabase, workspaceId, candidateId, userId)

  const { error } = await supabase
    .from('nmm_candidates')
    .update(patch)
    .eq('id', candidateId)
    .eq('workspace_id', workspaceId)
    .eq('owner_id', userId)
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  const inserts: NmmDailyActionInsert[] = []

  if (patch.stage && patch.stage !== currentCandidate.stage) {
    inserts.push({
      workspace_id: workspaceId,
      user_id: userId,
      candidate_id: candidateId,
      action_type: 'stage_change',
      note: patch.stage,
    })
  }

  if (patch.warmth !== undefined && patch.warmth !== currentCandidate.warmth) {
    const currentWarmth = resolveCandidateFields(currentCandidate).warmth
    const newWarmth = patch.warmth
    if (currentWarmth !== newWarmth) {
      inserts.push({
        workspace_id: workspaceId,
        user_id: userId,
        candidate_id: candidateId,
        action_type: 'note',
        note: `system_note:warmth_change:${currentWarmth}->${newWarmth}`,
      })
    }
  }

  if (
    patch.next_follow_up_at !== undefined &&
    patch.next_follow_up_at !== currentCandidate.next_follow_up_at
  ) {
    const oldDate = currentCandidate.next_follow_up_at || 'none'
    const newDate = patch.next_follow_up_at || 'none'
    inserts.push({
      workspace_id: workspaceId,
      user_id: userId,
      candidate_id: candidateId,
      action_type: 'note',
      note: `system_note:follow_up_change:${oldDate}->${newDate}`,
    })
  }

  if (
    (patch.full_name && patch.full_name !== currentCandidate.full_name) ||
    (patch.phone !== undefined && patch.phone !== currentCandidate.phone)
  ) {
    inserts.push({
      workspace_id: workspaceId,
      user_id: userId,
      candidate_id: candidateId,
      action_type: 'note',
      note: 'system_note:profile_update',
    })
  }

  if (inserts.length === 0) return

  const { error: actionError } = await supabase.from('nmm_daily_actions').insert(inserts)
  if (actionError) throw new Error(actionError.message)
}

export async function deleteCandidateAction(
  workspaceId: string,
  candidateId: string
): Promise<void> {
  const supabase = await createClient()
  const userId = await requireAuthUserId()

  const { error } = await supabase
    .from('nmm_candidates')
    .delete()
    .eq('id', candidateId)
    .eq('workspace_id', workspaceId)
    .eq('owner_id', userId)

  if (error) throw new Error(error.message)
}

export async function markCandidateContactedAction(
  workspaceId: string,
  candidateId: string,
  actionType: ActionType
): Promise<void> {
  const supabase = await createClient()
  const userId = await requireAuthUserId()
  await getOwnedCandidate(supabase, workspaceId, candidateId, userId)

  const touchedAt = new Date().toISOString()
  const [{ error: candidateError }, { error: actionError }] = await Promise.all([
    supabase
      .from('nmm_candidates')
      .update({ last_contact_at: touchedAt })
      .eq('id', candidateId)
      .eq('workspace_id', workspaceId)
      .eq('owner_id', userId),
    supabase.from('nmm_daily_actions').insert({
      workspace_id: workspaceId,
      user_id: userId,
      candidate_id: candidateId,
      action_type: actionType,
    }),
  ])

  if (candidateError) throw new Error(candidateError.message)
  if (actionError) throw new Error(actionError.message)
}

export async function fetchCandidateActivityHistoryAction(
  candidateId: string
): Promise<NmmDailyAction[]> {
  const supabase = await createClient()
  // Auth gate; yetki sınırı RLS'te. `nmm_daily_actions` kasıtlı olarak workspace +
  // downline scope'lu (`nmm_action_member_all`/`nmm_action_read_downlines`): bir aday
  // detayını sahibi de, lideri de (downline → /pipeline/[id]) görür. Burada
  // `.eq('user_id', ...)` filtresi lider notlarını ve liderin downline görünümünü kırardı.
  await requireAuthUserId()

  const { data, error } = await supabase
    .from('nmm_daily_actions')
    .select('*')
    .eq('candidate_id', candidateId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function fetchCandidateNotesAction(
  candidateId: string
): Promise<NmmDailyAction[]> {
  const supabase = await createClient()
  await requireAuthUserId()

  const { data, error } = await supabase
    .from('nmm_daily_actions')
    .select('*')
    .eq('candidate_id', candidateId)
    .eq('action_type', 'note')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function fetchLeaderNotesCountAction(candidateId: string): Promise<number> {
  const supabase = await createClient()
  await requireAuthUserId()

  const { count, error } = await supabase
    .from('nmm_daily_actions')
    .select('*', { count: 'exact', head: true })
    .eq('candidate_id', candidateId)
    .eq('action_type', 'note')
    .not('note', 'like', 'system_note:%')
    .or('note_tr.not.is.null,note_en.not.is.null')

  if (error) throw new Error(error.message)
  return count ?? 0
}

export async function addCandidateNoteAction(
  workspaceId: string,
  input: {
    candidateId: string
    noteTr: string
    noteEn?: string
  }
): Promise<void> {
  const supabase = await createClient()
  const userId = await requireAuthUserId()
  await getOwnedCandidate(supabase, workspaceId, input.candidateId, userId)

  // CLAUDE.md §2: çift-dilli KALICI saklama garantisi. İstemci çeviriyi geçemezse
  // (AI hatası → catch yolu) lazy/on-the-fly yerine yazım anında BURADA üretilir;
  // translateNoteAction hata/anahtar yokken TR metnini döndürür (asla boş bırakmaz).
  const noteEn = input.noteEn?.trim() ? input.noteEn : await translateNoteAction(input.noteTr)

  const { error } = await supabase.from('nmm_daily_actions').insert({
    workspace_id: workspaceId,
    user_id: userId,
    candidate_id: input.candidateId,
    action_type: 'note',
    ...buildDailyActionNoteFields({
      noteTr: input.noteTr,
      noteEn,
    }),
  })

  if (error) throw new Error(error.message)
}

export async function deleteCandidateActivityAction(
  workspaceId: string,
  input: {
    activityId: string
    candidateId: string
  }
): Promise<void> {
  const supabase = await createClient()
  const userId = await requireAuthUserId()
  await getOwnedCandidate(supabase, workspaceId, input.candidateId, userId)

  const { error } = await supabase
    .from('nmm_daily_actions')
    .delete()
    .eq('id', input.activityId)
    .eq('candidate_id', input.candidateId)
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
}
