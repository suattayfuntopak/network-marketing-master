/** Yerel takvim anahtarları — UTC kayması olmadan YYYY-MM-DD. */

const DEFAULT_TZ = 'Europe/Istanbul'

// Intl.DateTimeFormat kurulumu pahalı; .format() ucuz. istanbulDayKey döngülerde
// (satır başına) çağrıldığından formatter'ı timezone bazında önbelleğe al.
const _dayFmtCache = new Map<string, Intl.DateTimeFormat>()
function dayFormatter(timeZone: string): Intl.DateTimeFormat {
  let fmt = _dayFmtCache.get(timeZone)
  if (!fmt) {
    fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    _dayFmtCache.set(timeZone, fmt)
  }
  return fmt
}

export function toCalendarKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Sunucu/cron için sabit timezone ile bugünün anahtarı. */
export function todayCalendarKey(timeZone = DEFAULT_TZ): string {
  return dayFormatter(timeZone).format(new Date())
}

/**
 * Bir ISO/timestamp'ın İstanbul (UTC+3) takvim günü anahtarı (YYYY-MM-DD).
 * `created_at.slice(0,10)` UTC günü verir → gece 00:00–03:00 arası yanlış güne
 * düşer. Gün-bazlı metrik/seri (aktif gün, streak) için bunu kullan.
 */
export function istanbulDayKey(iso: string, timeZone = DEFAULT_TZ): string {
  return dayFormatter(timeZone).format(new Date(iso))
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

export function istanbulDayEndIso(key: string): string {
  return new Date(`${key}T23:59:59.999+03:00`).toISOString()
}
