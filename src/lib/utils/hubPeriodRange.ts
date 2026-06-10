import {
  fromCalendarKey,
  istanbulDayEndIso,
  istanbulDayStartIso,
  todayCalendarKey,
  toCalendarKey,
} from '@/lib/utils/calendarDates'

export type RollingWeekRange = {
  offset: number
  sinceIso: string
  untilIso: string
  startDate: Date
  endDate: Date
}

export type CalendarDayRange = {
  offset: number
  sinceIso: string
  untilIso: string
  date: Date
  calendarKey: string
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

export type YearRange = {
  offset: number
  sinceIso: string
  untilIso: string
  startDate: Date
  endDate: Date
  year: number
  daysInPeriod: number
  totalDaysInYear: number
  dayOfYear: number
  yearPct: number
  isCurrentYear: boolean
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

/** offset 0 = bugün, -1 = dün, +1 = yarın */
export function calendarDayRange(offset: number): CalendarDayRange {
  const today = fromCalendarKey(todayCalendarKey())
  const date = new Date(today)
  date.setDate(today.getDate() + offset)
  const calendarKey = toCalendarKey(date)
  return {
    offset,
    sinceIso: istanbulDayStartIso(calendarKey),
    untilIso: istanbulDayEndIso(calendarKey),
    date: startOfDay(date),
    calendarKey,
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

/** Mobil dönem şeridi — kısa ay adları, tek satıra sığar */
export function formatWeekRangeLabelCompact(start: Date, end: Date, lang: string): string {
  const locale = lang === 'en' ? 'en-US' : 'tr-TR'
  const month = end.toLocaleDateString(locale, { month: 'short' })
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()}–${end.getDate()} ${month}`
  }
  const a = start.toLocaleDateString(locale, { day: 'numeric', month: 'short' })
  const b = end.toLocaleDateString(locale, { day: 'numeric', month: 'short' })
  return `${a}–${b}`
}

export function formatMonthLabel(date: Date, lang: string): string {
  return date.toLocaleDateString(lang === 'en' ? 'en-US' : 'tr-TR', { month: 'long', year: 'numeric' })
}

export function formatMonthLabelCompact(date: Date, lang: string): string {
  return date.toLocaleDateString(lang === 'en' ? 'en-US' : 'tr-TR', { month: 'short', year: 'numeric' })
}

function daysInCalendarYear(year: number): number {
  return (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 366 : 365
}

/** offset 0 = içinde bulunulan takvim yılı */
export function yearRange(offset: number): YearRange {
  const now = new Date()
  const year = now.getFullYear() + offset
  const startDate = startOfDay(new Date(year, 0, 1))
  const isCurrentYear = offset === 0
  const endDate = isCurrentYear ? endOfDay(now) : endOfDay(new Date(year, 11, 31))
  const startKey = toCalendarKey(startDate)
  const endKey = toCalendarKey(endDate)
  const totalDaysInYear = daysInCalendarYear(year)
  const dayOfYear = isCurrentYear
    ? Math.floor((startOfDay(now).getTime() - startDate.getTime()) / 86_400_000) + 1
    : totalDaysInYear
  const daysInPeriod = dayOfYear
  const yearPct = isCurrentYear
    ? Math.round((dayOfYear / totalDaysInYear) * 100)
    : 100

  return {
    offset,
    sinceIso: istanbulDayStartIso(startKey),
    untilIso: istanbulDayEndIso(endKey),
    startDate,
    endDate,
    year,
    daysInPeriod,
    totalDaysInYear,
    dayOfYear,
    yearPct,
    isCurrentYear,
  }
}

export function formatYearLabel(year: number, lang: string, offset: number): string {
  if (offset === 0) return lang === 'en' ? 'This year' : 'Bu yıl'
  return String(year)
}

export function formatDayLabel(date: Date, lang: string, offset: number): string {
  if (offset === 0) return lang === 'en' ? 'Today' : 'Bugün'
  if (offset === -1) return lang === 'en' ? 'Yesterday' : 'Dün'
  if (offset === 1) return lang === 'en' ? 'Tomorrow' : 'Yarın'
  const locale = lang === 'en' ? 'en-US' : 'tr-TR'
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'long' })
}

export function parsePeriodOffset(raw: string | null): number {
  const n = parseInt(raw ?? '0', 10)
  return Number.isFinite(n) ? n : 0
}
