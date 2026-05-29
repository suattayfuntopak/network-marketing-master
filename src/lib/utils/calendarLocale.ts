/** Takvim başlıkları — Intl ile TR/EN; bileşende `lang === 'en'` gerekmez. */

function localeFor(lang: 'tr' | 'en') {
  return lang === 'en' ? 'en-GB' : 'tr-TR'
}

export function formatCalendarMonth(date: Date, lang: 'tr' | 'en') {
  return new Intl.DateTimeFormat(localeFor(lang), { month: 'long' }).format(date)
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
