'use server'

import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/authUser'
import {
  computeFieldStreak,
  periodStartIso,
  type FieldEngagementSummary,
} from '@/lib/domain/pulse'
import { todayCalendarKey, fromCalendarKey, toCalendarKey, istanbulDayKey } from '@/lib/utils/calendarDates'

const FIELD_ACTION_TYPES = new Set(['call', 'whatsapp', 'stage_change', 'note', 'ai_generate'])

export type FieldStreakActionRow = {
  id: string
  action_type: string
  note: string | null
  note_tr: string | null
  note_en: string | null
  created_at: string
  candidate_name: string | null
}

export type FieldStreakDayRow = {
  dayKey: string
  active: boolean
  actions: FieldStreakActionRow[]
}

export type FieldStreakDetail = {
  activeDays: number
  days: FieldStreakDayRow[]
}

export type MyPanoInsights = {
  fieldWeek: FieldEngagementSummary
  fieldStreak: number
}

export async function getFieldStreakDetailAction(workspaceId: string): Promise<FieldStreakDetail> {
  const empty: FieldStreakDetail = { activeDays: 0, days: [] }

  const supabase = await createClient()
  const { user } = await getAuthUser()
  if (!user) return empty

  const weekStart = periodStartIso('7d')!

  const { data: rows } = await supabase
    .from('nmm_daily_actions')
    .select('id, action_type, note, note_tr, note_en, created_at, candidate_id, nmm_candidates(full_name)')
    .eq('user_id', user.id)
    .eq('workspace_id', workspaceId)
    .gte('created_at', weekStart)
    .order('created_at', { ascending: false })

  const fieldRows = (rows ?? []).filter(r => FIELD_ACTION_TYPES.has(r.action_type))

  const days: FieldStreakDayRow[] = []
  const cursor = fromCalendarKey(todayCalendarKey()) // İstanbul bugünü

  for (let i = 0; i < 7; i++) {
    const d = new Date(cursor)
    d.setDate(d.getDate() - i)
    const dayKey = toCalendarKey(d)
    const actions: FieldStreakActionRow[] = fieldRows
      .filter(r => istanbulDayKey(r.created_at) === dayKey)
      .map(r => {
        const candidate = r.nmm_candidates as { full_name: string } | null
        return {
          id: r.id,
          action_type: r.action_type,
          note: r.note,
          note_tr: r.note_tr,
          note_en: r.note_en,
          created_at: r.created_at,
          candidate_name: candidate?.full_name ?? null,
        }
      })

    days.push({ dayKey, active: actions.length > 0, actions })
  }

  return {
    activeDays: computeFieldStreak(fieldRows),
    days,
  }
}

export async function getMyPanoInsightsAction(workspaceId: string): Promise<MyPanoInsights> {
  const emptyField: FieldEngagementSummary = {
    newCandidates: 0,
    calls: 0,
    whatsapps: 0,
    presentationsSent: 0,
    appointmentsSet: 0,
    appointmentsDone: 0,
  }

  const supabase = await createClient()
  const { user } = await getAuthUser()
  if (!user) return { fieldWeek: emptyField, fieldStreak: 0 }

  const weekStart = periodStartIso('7d')!

  const [{ data: weekActions }, { data: newCandidates }] = await Promise.all([
    supabase
      .from('nmm_daily_actions')
      .select('action_type, created_at')
      .eq('user_id', user.id)
      .gte('created_at', weekStart),
    supabase
      .from('nmm_candidates')
      .select('id')
      .eq('owner_id', user.id)
      .eq('workspace_id', workspaceId)
      .gte('created_at', weekStart),
  ])

  const fieldWeek: FieldEngagementSummary = { ...emptyField }
  fieldWeek.newCandidates = newCandidates?.length ?? 0

  for (const act of weekActions ?? []) {
    if (act.action_type === 'call') fieldWeek.calls++
    else if (act.action_type === 'whatsapp') fieldWeek.whatsapps++
    else if (act.action_type === 'stage_change') fieldWeek.presentationsSent++
  }

  const fieldStreak = computeFieldStreak(weekActions ?? [])

  return { fieldWeek, fieldStreak }
}
