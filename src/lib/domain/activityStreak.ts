import { fromCalendarKey, toCalendarKey } from '@/lib/utils/calendarDates'

/** Bir takvim anahtarının (YYYY-MM-DD) bir önceki günü. */
function previousDayKey(key: string): string {
  const d = fromCalendarKey(key)
  d.setDate(d.getDate() - 1)
  return toCalendarKey(d)
}

/**
 * Ardışık aktif-gün serisi (streak). `dayKeys` = kullanıcının `daily_active`
 * gün anahtarları (İstanbul takvim günü). Seri bugünden geriye doğru kesintisiz
 * sayılır; bugün henüz işlenmemişse dünden başlar (gün içinde kullanmadan kırılmasın).
 * Bugün de dün de yoksa seri kopmuştur → 0.
 */
export function computeActivityStreak(dayKeys: Iterable<string>, todayKey: string): number {
  const set = dayKeys instanceof Set ? dayKeys : new Set(dayKeys)
  if (set.size === 0) return 0

  let cursor = todayKey
  if (!set.has(cursor)) {
    cursor = previousDayKey(todayKey)
    if (!set.has(cursor)) return 0
  }

  let count = 0
  while (set.has(cursor)) {
    count++
    cursor = previousDayKey(cursor)
  }
  return count
}
