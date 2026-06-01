'use server'

import { createClient } from '@/lib/supabase/server'
import { isSuperAdmin } from '@/lib/domain/auth'
import {
  buildCalendarByDate,
  CALENDAR_TERMINAL_STAGES,
  FOLLOW_UP_CALENDAR_SUPPRESSED_ISO,
} from '@/lib/domain/calendarFollowUp'
import { fromCalendarKey, followUpToIsoFromKey, toCalendarKey } from '@/lib/utils/calendarDates'
import { logEngagementEventAction } from '@/app/(dashboard)/pulse/learningEvents'
import type { NmmCandidate } from '@/types/database.types'

export type TeamCalendarMemberSummary = {
  userId: string
  fullName: string
  days: { dateKey: string; count: number }[]
}

async function assertWorkspaceOwner(workspaceId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Oturum bulunamadı.')

  const { data: ws } = await supabase
    .from('nmm_workspaces')
    .select('owner_id, license_type')
    .eq('id', workspaceId)
    .single()

  if (!ws || ws.owner_id !== user.id) throw new Error('Yetkisiz işlem.')

  return { supabase, user, ws }
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

  await logEngagementEventAction(workspaceId, 'appointment_set', {
    candidate_id: candidateId,
    scheduled_at: iso,
    source: 'takvim_defer',
  })
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

  await logEngagementEventAction(workspaceId, 'appointment_done', {
    candidate_id: candidateId,
    completed_on: completedOnDateKey,
    source: 'takvim_complete',
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

function monthPrefix(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-`
}

function summarizeMemberMonth(
  candidates: NmmCandidate[],
  prefix: string,
): { dateKey: string; count: number }[] {
  const byDate = buildCalendarByDate(candidates)
  return Object.entries(byDate)
    .filter(([key]) => key.startsWith(prefix))
    .map(([dateKey, list]) => ({ dateKey, count: list.length }))
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
}

export async function fetchTeamCalendarSummaryAction(
  workspaceId: string,
  year: number,
  month: number,
): Promise<TeamCalendarMemberSummary[]> {
  const { supabase, user, ws } = await assertWorkspaceOwner(workspaceId)

  if (ws.license_type !== 'pro' && !isSuperAdmin(user)) {
    return []
  }

  // parent_id sponsorun user_id'sini saklar (migration 009). Mevcut kullanıcı lider
  // olduğundan downline'lar parent_id = user.id ile bulunur.
  const { data: downlineWs } = await supabase
    .from('nmm_workspaces')
    .select('id, owner_id')
    .eq('parent_id', user.id)

  if (!downlineWs?.length) return []

  const ownerIds = downlineWs.map(w => w.owner_id).filter(Boolean) as string[]

  const { data: members } = await supabase
    .from('nmm_workspace_members')
    .select('user_id, full_name')
    .in('user_id', ownerIds)

  const nameByUser: Record<string, string> = {}
  members?.forEach(m => { nameByUser[m.user_id] = m.full_name ?? 'Ekip üyesi' })

  const prefix = monthPrefix(year, month)
  const downlineWsIds = downlineWs.map(w => w.id)

  const { data: allCandidates } = await supabase
    .from('nmm_candidates')
    .select('*')
    .in('workspace_id', downlineWsIds)

  const candidatesByOwner = new Map<string, NmmCandidate[]>()
  for (const row of allCandidates ?? []) {
    const c = row as NmmCandidate
    if (!c.owner_id) continue
    const list = candidatesByOwner.get(c.owner_id) ?? []
    list.push(c)
    candidatesByOwner.set(c.owner_id, list)
  }

  const summaries: TeamCalendarMemberSummary[] = []

  for (const dl of downlineWs) {
    if (!dl.owner_id) continue

    const memberCandidates = (candidatesByOwner.get(dl.owner_id) ?? []).filter(
      c => c.workspace_id === dl.id,
    )

    const days = summarizeMemberMonth(memberCandidates, prefix)
    if (!days.length) continue

    summaries.push({
      userId: dl.owner_id,
      fullName: nameByUser[dl.owner_id] ?? 'Ekip üyesi',
      days,
    })
  }

  return summaries.sort((a, b) => a.fullName.localeCompare(b.fullName, 'tr'))
}
