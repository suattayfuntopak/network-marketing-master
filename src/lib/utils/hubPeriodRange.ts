import { fromCalendarKey, istanbulDayStartIso, todayCalendarKey, toCalendarKey } from '@/lib/utils/calendarDates'

export type RollingWeekRange = {
  offset: number
  sinceIso: string
  untilIso: string
  startDate: Date
  endDate: Date
}

export type MonthRange = {
  offset: number
  sinceIso: string
  untilIso: string
  startDate: Date
  endDate: Date
  daysInMonth: number
  dayOfMonth: number
  monthPct: number
}

function endOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function istanbulDayEndIso(key: string): string {
  return new Date(`${key}T23:59:59.999+03:00`).toISOString()
}

/** Pazartesi–Pazar takvim haftası (TR/ISO); offset 0 = içinde bulunulan hafta, -1 = geçmiş, +1 = gelecek */
export function rollingWeekRange(offset: number): RollingWeekRange {
  const today = fromCalendarKey(todayCalendarKey())
  const daysFromMonday = (today.getDay() + 6) % 7
  const monday = new Date(today)
  monday.setDate(today.getDate() - daysFromMonday + offset * 7)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const startKey = toCalendarKey(monday)
  const endKey = toCalendarKey(sunday)

  return {
    offset,
    sinceIso: istanbulDayStartIso(startKey),
    untilIso: istanbulDayEndIso(endKey),
    startDate: startOfDay(monday),
    endDate: startOfDay(sunday),
  }
}

/** offset 0 = içinde bulunulan ay */
export function monthRange(offset: number): MonthRange {
  const now = new Date()
  const ref = new Date(now.getFullYear(), now.getMonth() + offset, 1)
  const startDate = startOfDay(new Date(ref.getFullYear(), ref.getMonth(), 1))
  const lastDay = new Date(ref.getFullYear(), ref.getMonth() + 1, 0)
  const endDate = endOfDay(lastDay)
  const daysInMonth = lastDay.getDate()
  const isCurrent = offset === 0
  const dayOfMonth = isCurrent ? now.getDate() : daysInMonth
  const monthPct = isCurrent ? Math.round((dayOfMonth / daysInMonth) * 100) : 100
  return {
    offset,
    sinceIso: startDate.toISOString(),
    untilIso: endDate.toISOString(),
    startDate,
    endDate,
    daysInMonth,
    dayOfMonth,
    monthPct,
  }
}

export function formatWeekRangeLabel(start: Date, end: Date, lang: string): string {
  const locale = lang === 'en' ? 'en-US' : 'tr-TR'
  const month = end.toLocaleDateString(locale, { month: 'long' })
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()}–${end.getDate()} ${month}`
  }
  const a = start.toLocaleDateString(locale, { day: 'numeric', month: 'short' })
  const b = end.toLocaleDateString(locale, { day: 'numeric', month: 'long' })
  return `${a} – ${b}`
}

export function formatMonthLabel(date: Date, lang: string): string {
  return date.toLocaleDateString(lang === 'en' ? 'en-US' : 'tr-TR', { month: 'long', year: 'numeric' })
}

export function parsePeriodOffset(raw: string | null): number {
  const n = parseInt(raw ?? '0', 10)
  return Number.isFinite(n) ? n : 0
}
