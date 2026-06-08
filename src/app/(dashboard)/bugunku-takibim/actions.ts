'use server'

import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/authUser'
import { istanbulDayEndIso, istanbulDayStartIso, todayCalendarKey } from '@/lib/utils/calendarDates'
import { fetchFunnelActualsForPeriod, fetchFunnelActualsForToday } from '@/lib/domain/funnelActuals'
import type { FunnelCounts } from '@/lib/domain/roadmap'
import { formatSimpleNote, parseSimpleNote } from '@/lib/utils/noteParser'
import { translateEnToTrAction, translateNoteAction } from '@/app/(dashboard)/pipeline/[id]/actions'
import { saveDayJournalAction, getDayJournalAction } from '@/app/(dashboard)/bugun/ilgilen/actions/journal'

export interface DailyTrackPayload {
  actuals: FunnelCounts
  notes: string
}

const EMPTY_ACTUALS: FunnelCounts = { arama: 0, tanisma: 0, sunum: 0, yeniUye: 0 }

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
  if (!user) return { actuals: EMPTY_ACTUALS, notes: '' }

  const [actuals, journal] = await Promise.all([
    logDate === todayCalendarKey()
      ? fetchFunnelActualsForToday(supabase, user.id)
      : fetchFunnelActualsForPeriod(
          supabase,
          user.id,
          istanbulDayStartIso(logDate),
          istanbulDayEndIso(logDate),
          logDate,
          logDate,
        ),
    getDayJournalAction(logDate),
  ])

  const notes =
    'content' in journal && journal.content.trim()
      ? (lang === 'en'
          ? parseSimpleNote(journal.content).en || parseSimpleNote(journal.content).tr
          : parseSimpleNote(journal.content).tr || parseSimpleNote(journal.content).en)
      : ''

  return { actuals, notes }
}

/** Yalnızca günlük notları kaydeder; huni metrikleri boru hattından otomatik gelir. */
export async function saveDailyTrackAction(input: {
  notes: string
  lang: 'tr' | 'en'
  logDate?: string
}): Promise<{ ok: true } | { error: string }> {
  const { user } = await getAuthUser()
  if (!user) return { error: 'unauthorized' }

  const logDate = input.logDate ?? todayCalendarKey()
  const bilingual = await buildBilingualNotes(input.notes, input.lang)
  const journalResult = await saveDayJournalAction(bilingual, logDate)
  if ('error' in journalResult) return journalResult

  return { ok: true }
}
