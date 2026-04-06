import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths,
  addWeeks, subWeeks, addDays, startOfDay, endOfDay,
  isSameDay, parseISO, isAfter, isBefore,
  startOfWeek as dfStartOfWeek, endOfWeek as dfEndOfWeek,
} from 'date-fns'
import { tr, enUS } from 'date-fns/locale'
import i18n from '@/i18n'

export function getLocale() {
  return i18n.language?.startsWith('en') ? enUS : tr
}

export function fmtDate(date: Date | string, fmt: string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, fmt, { locale: getLocale() })
}

export function fmtTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'HH:mm')
}

export function fmtMonthYear(date: Date): string {
  return format(date, 'MMMM yyyy', { locale: getLocale() })
}

export function fmtWeekRange(date: Date): string {
  const locale = getLocale()
  const start = dfStartOfWeek(date, { weekStartsOn: 1 })
  const end = dfEndOfWeek(date, { weekStartsOn: 1 })
  if (start.getMonth() === end.getMonth()) {
    return `${format(start, 'd', { locale })} – ${format(end, 'd MMMM yyyy', { locale })}`
  }
  return `${format(start, 'd MMM', { locale })} – ${format(end, 'd MMM yyyy', { locale })}`
}

export function fmtDayFull(date: Date): string {
  return format(date, 'd MMMM yyyy, EEEE', { locale: getLocale() })
}

// Build a 6-row month grid (Sunday or Monday start)
export function buildMonthGrid(currentDate: Date): Date[][] {
  const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 })
  const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start, end })
  // Pad to 42 cells (6 weeks)
  while (days.length < 42) days.push(addDays(days[days.length - 1], 1))
  const weeks: Date[][] = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))
  return weeks
}

// Build 7 days for week view (Mon-Sun)
export function buildWeekDays(currentDate: Date): Date[] {
  const start = dfStartOfWeek(currentDate, { weekStartsOn: 1 })
  return eachDayOfInterval({ start, end: dfEndOfWeek(currentDate, { weekStartsOn: 1 }) })
}

// Navigate helpers
export const prevMonth = (d: Date) => subMonths(d, 1)
export const nextMonth = (d: Date) => addMonths(d, 1)
export const prevWeek  = (d: Date) => subWeeks(d, 1)
export const nextWeek  = (d: Date) => addWeeks(d, 1)
export const prevDay   = (d: Date) => addDays(d, -1)
export const nextDay   = (d: Date) => addDays(d, 1)

export { isSameDay, isToday, isSameMonth, startOfDay, endOfDay, parseISO, addDays, isAfter, isBefore }

// Get day boundary timestamps for queries
export function dayRange(date: Date): { from: string; to: string } {
  return {
    from: startOfDay(date).toISOString(),
    to: endOfDay(date).toISOString(),
  }
}

// Format for display in lists
export function relativeDay(date: Date | string, t: (key: string, opts?: object) => string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  const locale = getLocale()
  if (isToday(d)) return t('calendar.today')
  const tomorrow = addDays(new Date(), 1)
  if (isSameDay(d, tomorrow)) return t('calendar.tomorrow')
  return format(d, 'd MMMM', { locale })
}
