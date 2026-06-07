'use server'

import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/authUser'
import { todayCalendarKey } from '@/lib/utils/calendarDates'
import { formatSimpleNote, parseSimpleNote } from '@/lib/utils/noteParser'
import { translateEnToTrAction, translateNoteAction } from '@/app/(dashboard)/pipeline/[id]/actions'
import { saveDayJournalAction, getDayJournalAction } from '@/app/(dashboard)/bugun/ilgilen/actions/journal'

export interface DailyFieldLog {
  logDate: string
  calls: number
  contacts: number
  presentations: number
  newMembers: number
}

export interface DailyTrackPayload {
  fieldLog: DailyFieldLog
  notes: string
}

const EMPTY_LOG = (logDate: string): DailyFieldLog => ({
  logDate,
  calls: 0,
  contacts: 0,
  presentations: 0,
  newMembers: 0,
})

function clampMetric(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.min(9999, Math.max(0, Math.floor(n)))
}

async function buildBilingualNotes(text: string, lang: 'tr' | 'en'): Promise<string> {
  const trimmed = text.trim()
  if (!trimmed) return ''
  if (trimmed.includes('|||')) return trimmed
  if (lang === 'tr') {
    const en = await translateNoteAction(trimmed).catch(() => trimmed)
    return formatSimpleNote(trimmed, en)
  }
  const tr = await translateEnToTrAction(trimmed).catch(() => trimmed)
  return formatSimpleNote(tr, trimmed)
}

export async function getDailyTrackAction(
  lang: 'tr' | 'en' = 'tr',
  logDate: string = todayCalendarKey(),
): Promise<DailyTrackPayload> {
  const supabase = await createClient()
  const { user } = await getAuthUser()
  if (!user) return { fieldLog: EMPTY_LOG(logDate), notes: '' }

  const [{ data: row }, journal] = await Promise.all([
    supabase
      .from('nmm_daily_field_log')
      .select('log_date, calls, contacts, presentations, new_members')
      .eq('user_id', user.id)
      .eq('log_date', logDate)
      .maybeSingle(),
    getDayJournalAction(logDate),
  ])

  const notes =
    'content' in journal && journal.content.trim()
      ? (lang === 'en'
          ? parseSimpleNote(journal.content).en || parseSimpleNote(journal.content).tr
          : parseSimpleNote(journal.content).tr || parseSimpleNote(journal.content).en)
      : ''

  if (!row) return { fieldLog: EMPTY_LOG(logDate), notes }

  return {
    fieldLog: {
      logDate: row.log_date,
      calls: row.calls,
      contacts: row.contacts,
      presentations: row.presentations,
      newMembers: row.new_members,
    },
    notes,
  }
}

export async function saveDailyTrackAction(input: {
  calls: number
  contacts: number
  presentations: number
  newMembers: number
  notes: string
  lang: 'tr' | 'en'
  logDate?: string
}): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient()
  const { user } = await getAuthUser()
  if (!user) return { error: 'unauthorized' }

  const logDate = input.logDate ?? todayCalendarKey()

  const { error: logError } = await supabase.from('nmm_daily_field_log').upsert(
    {
      user_id: user.id,
      log_date: logDate,
      calls: clampMetric(input.calls),
      contacts: clampMetric(input.contacts),
      presentations: clampMetric(input.presentations),
      new_members: clampMetric(input.newMembers),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,log_date' },
  )
  if (logError) return { error: logError.message }

  const bilingual = await buildBilingualNotes(input.notes, input.lang)
  const journalResult = await saveDayJournalAction(bilingual, logDate)
  if ('error' in journalResult) return journalResult

  return { ok: true }
}
