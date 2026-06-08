/** Takvim başlıkları — Intl ile TR/EN; bileşende `lang === 'en'` gerekmez. */

import { fromCalendarKey } from '@/lib/utils/calendarDates'

function localeFor(lang: 'tr' | 'en') {
  return lang === 'en' ? 'en-GB' : 'tr-TR'
}

export function formatCalendarMonth(date: Date, lang: 'tr' | 'en') {
  return new Intl.DateTimeFormat(localeFor(lang), { month: 'long' }).format(date)
}

/** Pano selamlama altı — 08 Haziran 2026 Pazartesi / Monday, 8 June 2026 */
export function formatPanoDateLine(date: Date, lang: 'tr' | 'en') {
  return new Intl.DateTimeFormat(localeFor(lang), {
    day: lang === 'tr' ? '2-digit' : 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
  }).format(date)
}

/** Tam tarih: 17 Haziran 2026 / 17 June 2026 */
export function formatCalendarDayKey(key: string, lang: 'tr' | 'en') {
  return new Intl.DateTimeFormat(localeFor(lang), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(fromCalendarKey(key))
}

/** Kısa tarih: 17 Haz / 17 Jun */
export function formatCalendarDayShort(key: string, lang: 'tr' | 'en') {
  return new Intl.DateTimeFormat(localeFor(lang), {
    day: 'numeric',
    month: 'short',
  }).format(fromCalendarKey(key))
}

/** Pazartesi başlangıçlı kısa gün adları (Pzt … Paz / Mon … Sun). */
export function weekdayShortLabels(lang: 'tr' | 'en') {
  const fmt = new Intl.DateTimeFormat(localeFor(lang), { weekday: 'short' })
  const monday = new Date(2025, 0, 6, 12, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return fmt.format(d)
  })
}
