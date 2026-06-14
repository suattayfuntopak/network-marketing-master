'use server'

import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/authUser'
import {
  CALENDAR_TERMINAL_STAGES,
  FOLLOW_UP_CALENDAR_SUPPRESSED_ISO,
} from '@/lib/domain/calendarFollowUp'
import { fromCalendarKey, followUpToIsoFromKey, toCalendarKey } from '@/lib/utils/calendarDates'

async function assertWorkspaceOwner(workspaceId: string) {
  const supabase = await createClient()
  const { user } = await getAuthUser()
  if (!user) throw new Error('Oturum bulunamadı.')

  const { data: ws } = await supabase
    .from('nmm_workspaces')
    .select('owner_id')
    .eq('id', workspaceId)
    .single()

  if (!ws || ws.owner_id !== user.id) throw new Error('Yetkisiz işlem.')

  return { supabase, user }
}

async function logFollowUpChange(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
  userId: string,
  candidateId: string,
  oldDate: string | null,
  newDate: string | null,
) {
  await supabase.from('nmm_daily_actions').insert({
    workspace_id: workspaceId,
    user_id: userId,
    candidate_id: candidateId,
    action_type: 'note',
    note: `system_note:follow_up_change:${oldDate ?? 'none'}->${newDate ?? 'none'}`,
  })
}

export async function deferFollowUpAction(
  workspaceId: string,
  candidateId: string,
  anchorDateKey: string,
  addDays: number,
): Promise<void> {
  const { supabase, user } = await assertWorkspaceOwner(workspaceId)

  const { data: candidate } = await supabase
    .from('nmm_candidates')
    .select('*')
    .eq('id', candidateId)
    .eq('workspace_id', workspaceId)
    .eq('owner_id', user.id)
    .single()

  if (!candidate) throw new Error('Aday bulunamadı.')

  const base = fromCalendarKey(anchorDateKey)
  base.setDate(base.getDate() + addDays)
  const iso = followUpToIsoFromKey(toCalendarKey(base))

  const { error } = await supabase
    .from('nmm_candidates')
    .update({ next_follow_up_at: iso })
    .eq('id', candidateId)

  if (error) throw new Error(error.message)

  await logFollowUpChange(
    supabase,
    workspaceId,
    user.id,
    candidateId,
    candidate.next_follow_up_at,
    iso,
  )
}

export async function clearFollowUpAction(
  workspaceId: string,
  candidateId: string,
  completedOnDateKey: string,
): Promise<void> {
  const { supabase, user } = await assertWorkspaceOwner(workspaceId)

  const { data: candidate } = await supabase
    .from('nmm_candidates')
    .select('next_follow_up_at')
    .eq('id', candidateId)
    .eq('workspace_id', workspaceId)
    .eq('owner_id', user.id)
    .single()

  if (!candidate) throw new Error('Aday bulunamadı.')

  const { error } = await supabase
    .from('nmm_candidates')
    .update({ next_follow_up_at: FOLLOW_UP_CALENDAR_SUPPRESSED_ISO })
    .eq('id', candidateId)

  if (error) throw new Error(error.message)

  await logFollowUpChange(
    supabase,
    workspaceId,
    user.id,
    candidateId,
    candidate.next_follow_up_at,
    FOLLOW_UP_CALENDAR_SUPPRESSED_ISO,
  )

  await supabase.from('nmm_daily_actions').insert({
    workspace_id: workspaceId,
    user_id: user.id,
    candidate_id: candidateId,
    action_type: 'note',
    note: `system_note:follow_up_cleared:${completedOnDateKey}`,
  })
}

export async function bulkDeferOverdueFollowUpsAction(
  workspaceId: string,
  candidateIds: string[],
  targetDateKey: string,
): Promise<{ updated: number }> {
  if (!candidateIds.length) return { updated: 0 }

  const { supabase, user } = await assertWorkspaceOwner(workspaceId)
  const targetIso = followUpToIsoFromKey(targetDateKey)

  // Tek sorguyla doğrula (N+1 yerine batch). Terminal aşamadaki adaylar (katıldı,
  // ilgilenmedi, kayboldu, pasif) toplu ertelemeye dahil edilmez.
  const { data: candidates } = await supabase
    .from('nmm_candidates')
    .select('id, next_follow_up_at, stage')
    .in('id', candidateIds)
    .eq('workspace_id', workspaceId)
    .eq('owner_id', user.id)

  const eligible = (candidates ?? []).filter(
    c => !CALENDAR_TERMINAL_STAGES.includes(c.stage),
  )
  if (!eligible.length) return { updated: 0 }

  const eligibleIds = eligible.map(c => c.id)
  const { error: updateError } = await supabase
    .from('nmm_candidates')
    .update({ next_follow_up_at: targetIso })
    .in('id', eligibleIds)

  if (updateError) return { updated: 0 }

  // Audit log — tek toplu insert.
  const logRows = eligible.map(c => ({
    workspace_id: workspaceId,
    user_id: user.id,
    candidate_id: c.id,
    action_type: 'note' as const,
    note: `system_note:follow_up_change:${c.next_follow_up_at ?? 'none'}->${targetIso}`,
  }))
  await supabase.from('nmm_daily_actions').insert(logRows)

  return { updated: eligible.length }
}
