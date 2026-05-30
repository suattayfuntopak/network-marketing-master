'use server'

import { createClient } from '@/lib/supabase/server'
import { SUPER_ADMIN_EMAIL } from '@/lib/constants'
import { buildCalendarByDate, nextFollowUpKeyAfterCompletion } from '@/lib/domain/calendarFollowUp'
import { fromCalendarKey, followUpToIsoFromKey, toCalendarKey } from '@/lib/utils/calendarDates'
import type { NmmCandidate, CandidateStage } from '@/types/database.types'

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
}

export async function clearFollowUpAction(
  workspaceId: string,
  candidateId: string,
  completedOnDateKey: string,
): Promise<void> {
  const { supabase, user } = await assertWorkspaceOwner(workspaceId)

  const { data: candidate } = await supabase
    .from('nmm_candidates')
    .select('next_follow_up_at, last_contact_at, stage')
    .eq('id', candidateId)
    .eq('workspace_id', workspaceId)
    .eq('owner_id', user.id)
    .single()

  if (!candidate) throw new Error('Aday bulunamadı.')

  const nowIso = new Date().toISOString()
  const stage = candidate.stage as CandidateStage
  const nextKey = nextFollowUpKeyAfterCompletion(completedOnDateKey, stage)
  const nextIso = nextKey ? followUpToIsoFromKey(nextKey) : null

  const { error } = await supabase
    .from('nmm_candidates')
    .update({
      next_follow_up_at: nextIso,
      last_contact_at: nowIso,
    })
    .eq('id', candidateId)

  if (error) throw new Error(error.message)

  await logFollowUpChange(
    supabase,
    workspaceId,
    user.id,
    candidateId,
    candidate.next_follow_up_at,
    nextIso,
  )

  await supabase.from('nmm_daily_actions').insert({
    workspace_id: workspaceId,
    user_id: user.id,
    candidate_id: candidateId,
    action_type: 'note',
    note: 'system_note:follow_up_completed',
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

  let updated = 0
  for (const id of candidateIds) {
    const { data: candidate } = await supabase
      .from('nmm_candidates')
      .select('id, next_follow_up_at')
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .eq('owner_id', user.id)
      .maybeSingle()

    if (!candidate) continue

    const { error: updateError } = await supabase
      .from('nmm_candidates')
      .update({ next_follow_up_at: targetIso })
      .eq('id', id)

    if (updateError) continue

    await logFollowUpChange(
      supabase,
      workspaceId,
      user.id,
      id,
      candidate.next_follow_up_at,
      targetIso,
    )
    updated++
  }

  return { updated }
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

  const isSuperAdmin = user.email === SUPER_ADMIN_EMAIL
  if (ws.license_type !== 'pro' && !isSuperAdmin) {
    return []
  }

  const { data: downlineWs } = await supabase
    .from('nmm_workspaces')
    .select('id, owner_id')
    .or(`parent_id.eq.${workspaceId},parent_id.eq.${user.id}`)

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
