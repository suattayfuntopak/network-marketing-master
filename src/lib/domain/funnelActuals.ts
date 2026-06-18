import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { EMPTY_FUNNEL, type FunnelCounts } from '@/lib/domain/roadmap'
import type { PulsePeriod, SheetActivityPeriod } from '@/lib/domain/pulse'
import {
  fromCalendarKey,
  istanbulDayEndIso,
  istanbulDayStartIso,
  todayCalendarKey,
  toCalendarKey,
} from '@/lib/utils/calendarDates'

export type FunnelPeriodRange = {
  sinceIso: string
  untilIso: string
  startCalendarKey: string
  endCalendarKey: string
}

const ISTANBUL = 'Europe/Istanbul'

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

/** Gün bazında boru hattı aksiyonlarını toplar. */
export function sumFunnelDays(dayKeys: string[], actionsByDay: Map<string, FunnelCounts>): FunnelCounts {
  return dayKeys.reduce(
    (total, key) => addFunnel(total, actionsByDay.get(key) ?? EMPTY_FUNNEL),
    { ...EMPTY_FUNNEL },
  )
}

/**
 * Dönem huni gerçekleşenleri — tek kaynak: boru hattı (`nmm_daily_actions` + `nmm_candidates`).
 * Elle girilen field_log sayıları huni metriklerinde kullanılmaz.
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

  const [calls, stages, candidates] = await Promise.all([
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

  return sumFunnelDays(dayKeys, actionsByDay)
}


/** İstatistikler / ekip nabzı — PulsePeriod → İstanbul hizalı dönem penceresi. */
export async function fetchFunnelActualsBatchForPeriod(
  supabase: SupabaseClient<Database>,
  userIds: string[],
  sinceIso: string,
  untilIso: string,
  startCalendarKey: string,
  endCalendarKey: string,
): Promise<Record<string, FunnelCounts>> {
  const uniqueIds = [...new Set(userIds.filter(Boolean))]
  const result: Record<string, FunnelCounts> = {}
  if (uniqueIds.length === 0) return result

  const dayKeys = calendarKeysBetween(startCalendarKey, endCalendarKey)
  const dayKeySet = new Set(dayKeys)
  const actionsByUserDay = new Map<string, Map<string, FunnelCounts>>()

  const ensureUserDay = (userId: string, dayKey: string): FunnelCounts => {
    let userMap = actionsByUserDay.get(userId)
    if (!userMap) {
      userMap = new Map()
      actionsByUserDay.set(userId, userMap)
    }
    let bucket = userMap.get(dayKey)
    if (!bucket) {
      bucket = { ...EMPTY_FUNNEL }
      userMap.set(dayKey, bucket)
    }
    return bucket
  }

  const [calls, stages, candidates] = await Promise.all([
    supabase
      .from('nmm_daily_actions')
      .select('user_id, created_at')
      .in('user_id', uniqueIds)
      .eq('action_type', 'call')
      .gte('created_at', sinceIso)
      .lte('created_at', untilIso),
    supabase
      .from('nmm_daily_actions')
      .select('user_id, created_at, note')
      .in('user_id', uniqueIds)
      .eq('action_type', 'stage_change')
      .gte('created_at', sinceIso)
      .lte('created_at', untilIso),
    supabase
      .from('nmm_candidates')
      .select('owner_id, created_at')
      .in('owner_id', uniqueIds)
      .gte('created_at', sinceIso)
      .lte('created_at', untilIso),
  ])

  for (const row of calls.data ?? []) {
    const key = istanbulCalendarKeyFromIso(row.created_at)
    if (!dayKeySet.has(key)) continue
    ensureUserDay(row.user_id, key).arama++
  }

  for (const row of candidates.data ?? []) {
    const key = istanbulCalendarKeyFromIso(row.created_at)
    if (!dayKeySet.has(key)) continue
    ensureUserDay(row.owner_id, key).tanisma++
  }

  for (const row of stages.data ?? []) {
    const key = istanbulCalendarKeyFromIso(row.created_at)
    if (!dayKeySet.has(key)) continue
    const delta = stageNoteToFunnelDelta(row.note)
    const bucket = ensureUserDay(row.user_id, key)
    bucket.sunum += delta.sunum
    bucket.yeniUye += delta.yeniUye
  }

  for (const uid of uniqueIds) {
    const userMap = actionsByUserDay.get(uid) ?? new Map<string, FunnelCounts>()
    result[uid] = sumFunnelDays(dayKeys, userMap)
  }

  return result
}

/** Çoklu dönem ranking — tek DB turunda günlük huni haritası (bellekte dilimlenir). */
export async function fetchFunnelActualsBatchUserDays(
  supabase: SupabaseClient<Database>,
  userIds: string[],
  sinceIso: string,
  untilIso: string,
  startCalendarKey: string,
  endCalendarKey: string,
): Promise<Map<string, Map<string, FunnelCounts>>> {
  const uniqueIds = [...new Set(userIds.filter(Boolean))]
  const actionsByUserDay = new Map<string, Map<string, FunnelCounts>>()
  if (uniqueIds.length === 0) return actionsByUserDay

  const dayKeys = calendarKeysBetween(startCalendarKey, endCalendarKey)
  const dayKeySet = new Set(dayKeys)

  const ensureUserDay = (userId: string, dayKey: string): FunnelCounts => {
    let userMap = actionsByUserDay.get(userId)
    if (!userMap) {
      userMap = new Map()
      actionsByUserDay.set(userId, userMap)
    }
    let bucket = userMap.get(dayKey)
    if (!bucket) {
      bucket = { ...EMPTY_FUNNEL }
      userMap.set(dayKey, bucket)
    }
    return bucket
  }

  const [calls, stages, candidates] = await Promise.all([
    supabase
      .from('nmm_daily_actions')
      .select('user_id, created_at')
      .in('user_id', uniqueIds)
      .eq('action_type', 'call')
      .gte('created_at', sinceIso)
      .lte('created_at', untilIso),
    supabase
      .from('nmm_daily_actions')
      .select('user_id, created_at, note')
      .in('user_id', uniqueIds)
      .eq('action_type', 'stage_change')
      .gte('created_at', sinceIso)
      .lte('created_at', untilIso),
    supabase
      .from('nmm_candidates')
      .select('owner_id, created_at')
      .in('owner_id', uniqueIds)
      .gte('created_at', sinceIso)
      .lte('created_at', untilIso),
  ])

  for (const row of calls.data ?? []) {
    const key = istanbulCalendarKeyFromIso(row.created_at)
    if (!dayKeySet.has(key)) continue
    ensureUserDay(row.user_id, key).arama++
  }

  for (const row of candidates.data ?? []) {
    const key = istanbulCalendarKeyFromIso(row.created_at)
    if (!dayKeySet.has(key)) continue
    ensureUserDay(row.owner_id, key).tanisma++
  }

  for (const row of stages.data ?? []) {
    const key = istanbulCalendarKeyFromIso(row.created_at)
    if (!dayKeySet.has(key)) continue
    const delta = stageNoteToFunnelDelta(row.note)
    const bucket = ensureUserDay(row.user_id, key)
    bucket.sunum += delta.sunum
    bucket.yeniUye += delta.yeniUye
  }

  return actionsByUserDay
}

export function funnelTotalsForUserInRange(
  userDayMap: Map<string, FunnelCounts> | undefined,
  startCalendarKey: string,
  endCalendarKey: string,
): FunnelCounts {
  const dayKeys = calendarKeysBetween(startCalendarKey, endCalendarKey)
  return sumFunnelDays(dayKeys, userDayMap ?? new Map())
}

/** İstatistikler / ekip nabzı — PulsePeriod → İstanbul hizalı dönem penceresi. */
export function funnelRangeForPulsePeriod(period: PulsePeriod): FunnelPeriodRange {
  const end = todayCalendarKey()
  const endIso = istanbulDayEndIso(end)

  if (period === 'today') {
    return {
      sinceIso: istanbulDayStartIso(end),
      untilIso: endIso,
      startCalendarKey: end,
      endCalendarKey: end,
    }
  }

  const endDate = fromCalendarKey(end)
  let startDate: Date

  if (period === '7d') {
    startDate = new Date(endDate)
    startDate.setDate(startDate.getDate() - 6)
  } else if (period === '30d') {
    startDate = new Date(endDate)
    startDate.setDate(startDate.getDate() - 29)
  } else if (period === 'all') {
    return {
      sinceIso: '1970-01-01T00:00:00.000Z',
      untilIso: endIso,
      startCalendarKey: '1970-01-01',
      endCalendarKey: end,
    }
  } else if (period === 'ytd') {
    startDate = new Date(endDate.getFullYear(), 0, 1)
  } else {
    startDate = new Date(endDate)
    startDate.setDate(startDate.getDate() - 29)
  }

  const start = toCalendarKey(startDate)
  return {
    sinceIso: istanbulDayStartIso(start),
    untilIso: endIso,
    startCalendarKey: start,
    endCalendarKey: end,
  }
}

export function funnelRangeForSheetPeriod(period: SheetActivityPeriod): FunnelPeriodRange {
  return funnelRangeForPulsePeriod(period)
}

/** Bugünün huni gerçekleşenleri — boru hattından otomatik. */
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
