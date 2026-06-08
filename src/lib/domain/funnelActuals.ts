import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import type { FunnelCounts } from '@/lib/domain/roadmap'
import {
  fromCalendarKey,
  istanbulDayEndIso,
  istanbulDayStartIso,
  todayCalendarKey,
  toCalendarKey,
} from '@/lib/utils/calendarDates'

const ISTANBUL = 'Europe/Istanbul'

const EMPTY_FUNNEL: FunnelCounts = { arama: 0, tanisma: 0, sunum: 0, yeniUye: 0 }

export function istanbulCalendarKeyFromIso(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ISTANBUL,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso))
}

export function calendarKeysBetween(startKey: string, endKey: string): string[] {
  const keys: string[] = []
  const cursor = fromCalendarKey(startKey)
  const end = fromCalendarKey(endKey)
  while (cursor <= end) {
    keys.push(toCalendarKey(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return keys
}

export function fieldLogRowToFunnel(row: {
  calls: number
  contacts: number
  presentations: number
  new_members: number
}): FunnelCounts {
  return {
    arama: row.calls,
    tanisma: row.contacts,
    sunum: row.presentations,
    yeniUye: row.new_members,
  }
}

function stageNoteToFunnelDelta(note: string | null): Pick<FunnelCounts, 'sunum' | 'yeniUye'> {
  const n = (note ?? '').toLowerCase().trim()
  if (n === 'sunum' || n === 'sunum yapıldı') return { sunum: 1, yeniUye: 0 }
  if (n === 'katildi' || n === 'katıldı' || n === 'joined') return { sunum: 0, yeniUye: 1 }
  return { sunum: 0, yeniUye: 0 }
}

function addFunnel(a: FunnelCounts, b: FunnelCounts): FunnelCounts {
  return {
    arama: a.arama + b.arama,
    tanisma: a.tanisma + b.tanisma,
    sunum: a.sunum + b.sunum,
    yeniUye: a.yeniUye + b.yeniUye,
  }
}

/** Gün bazında: field_log varsa o günün kaydı, yoksa boru hattı aksiyonları. */
export function mergeFunnelDays(
  dayKeys: string[],
  fieldLogByDay: Map<string, FunnelCounts>,
  actionsByDay: Map<string, FunnelCounts>,
): FunnelCounts {
  return dayKeys.reduce(
    (total, key) => addFunnel(total, fieldLogByDay.get(key) ?? actionsByDay.get(key) ?? EMPTY_FUNNEL),
    { ...EMPTY_FUNNEL },
  )
}

/**
 * Dönem huni gerçekleşenleri — Bugün Ne Yaptım (field_log) + boru hattı (actions/candidates).
 * Günlük hedef ile aynı kural: o gün için field_log varsa elle girilen sayılar geçerli;
 * yoksa otomatik aksiyon sayımı kullanılır. Günler toplanır, çift sayım olmaz.
 */
export async function fetchFunnelActualsForPeriod(
  supabase: SupabaseClient<Database>,
  userId: string,
  sinceIso: string,
  untilIso: string,
  startCalendarKey: string,
  endCalendarKey: string,
): Promise<FunnelCounts> {
  const dayKeys = calendarKeysBetween(startCalendarKey, endCalendarKey)
  const dayKeySet = new Set(dayKeys)

  const [fieldLogs, calls, stages, candidates] = await Promise.all([
    supabase
      .from('nmm_daily_field_log')
      .select('log_date, calls, contacts, presentations, new_members')
      .eq('user_id', userId)
      .gte('log_date', startCalendarKey)
      .lte('log_date', endCalendarKey),
    supabase
      .from('nmm_daily_actions')
      .select('created_at')
      .eq('user_id', userId)
      .eq('action_type', 'call')
      .gte('created_at', sinceIso)
      .lte('created_at', untilIso),
    supabase
      .from('nmm_daily_actions')
      .select('created_at, note')
      .eq('user_id', userId)
      .eq('action_type', 'stage_change')
      .gte('created_at', sinceIso)
      .lte('created_at', untilIso),
    supabase
      .from('nmm_candidates')
      .select('created_at')
      .eq('owner_id', userId)
      .gte('created_at', sinceIso)
      .lte('created_at', untilIso),
  ])

  const fieldLogByDay = new Map<string, FunnelCounts>()
  for (const row of fieldLogs.data ?? []) {
    fieldLogByDay.set(row.log_date, fieldLogRowToFunnel(row))
  }

  const actionsByDay = new Map<string, FunnelCounts>()
  const ensureDay = (key: string): FunnelCounts => {
    let bucket = actionsByDay.get(key)
    if (!bucket) {
      bucket = { ...EMPTY_FUNNEL }
      actionsByDay.set(key, bucket)
    }
    return bucket
  }

  for (const row of calls.data ?? []) {
    const key = istanbulCalendarKeyFromIso(row.created_at)
    if (!dayKeySet.has(key)) continue
    ensureDay(key).arama++
  }

  for (const row of candidates.data ?? []) {
    const key = istanbulCalendarKeyFromIso(row.created_at)
    if (!dayKeySet.has(key)) continue
    ensureDay(key).tanisma++
  }

  for (const row of stages.data ?? []) {
    const key = istanbulCalendarKeyFromIso(row.created_at)
    if (!dayKeySet.has(key)) continue
    const delta = stageNoteToFunnelDelta(row.note)
    const bucket = ensureDay(key)
    bucket.sunum += delta.sunum
    bucket.yeniUye += delta.yeniUye
  }

  return mergeFunnelDays(dayKeys, fieldLogByDay, actionsByDay)
}

/** Bugünün huni gerçekleşenleri — haftalık/aylık ile aynı birleştirme kuralı. */
export async function fetchFunnelActualsForToday(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<FunnelCounts> {
  const day = todayCalendarKey()
  return fetchFunnelActualsForPeriod(
    supabase,
    userId,
    istanbulDayStartIso(day),
    istanbulDayEndIso(day),
    day,
    day,
  )
}
