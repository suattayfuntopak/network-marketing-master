/** Yerel takvim anahtarları — UTC kayması olmadan YYYY-MM-DD. */

const DEFAULT_TZ = 'Europe/Istanbul'

export function toCalendarKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Sunucu/cron için sabit timezone ile bugünün anahtarı. */
export function todayCalendarKey(timeZone = DEFAULT_TZ): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export function yesterdayCalendarKey(timeZone = DEFAULT_TZ): string {
  const today = todayCalendarKey(timeZone)
  const d = fromCalendarKey(today)
  d.setDate(d.getDate() - 1)
  return toCalendarKey(d)
}

export function fromCalendarKey(key: string): Date {
  const [y, m, day] = key.split('-').map(Number)
  return new Date(y, m - 1, day, 12, 0, 0)
}

export function keysForDaysAfter(anchorKey: string, count: number): string[] {
  const anchor = fromCalendarKey(anchorKey)
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(anchor)
    d.setDate(d.getDate() + i + 1)
    return toCalendarKey(d)
  })
}

/** Takvim anahtarından DB'ye yazılacak ISO (yerel öğlen 12:00). */
export function followUpToIsoFromKey(key: string): string {
  return fromCalendarKey(key).toISOString()
}

/**
 * Takvim anahtarının İstanbul gün başlangıcı (00:00 +03:00) ISO'su.
 * Türkiye 2016'dan beri sabit UTC+3 (DST yok), bu yüzden offset sabittir.
 * Cron idempotency penceresi için `todayCalendarKey()` ile aynı günü işaret eder.
 */
export function istanbulDayStartIso(key: string): string {
  return new Date(`${key}T00:00:00+03:00`).toISOString()
}
