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
