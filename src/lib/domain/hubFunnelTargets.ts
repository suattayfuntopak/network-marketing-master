import {
  WORKING_DAYS_PER_MONTH,
  currentMonthIndex,
  type FunnelCounts,
  type RoadmapStage,
} from '@/lib/domain/roadmap'
import { funnelRangeForPulsePeriod } from '@/lib/domain/funnelActuals'
import type { PulsePeriod } from '@/lib/domain/pulse'
import { fromCalendarKey } from '@/lib/utils/calendarDates'

const EMPTY_FUNNEL: FunnelCounts = { arama: 0, tanisma: 0, sunum: 0, yeniUye: 0 }

export type GoalFunnelContext = {
  startAt: Date
  targetMonths: number
  roadmap: RoadmapStage[]
}

function addFunnel(a: FunnelCounts, b: FunnelCounts): FunnelCounts {
  return {
    arama: a.arama + b.arama,
    tanisma: a.tanisma + b.tanisma,
    sunum: a.sunum + b.sunum,
    yeniUye: a.yeniUye + b.yeniUye,
  }
}

/** Yol haritası ay indeksi (1-tabanlı) → kademe; süre dolduysa son kademe. */
export function stageForRoadmapMonth(
  roadmap: RoadmapStage[],
  monthIndex: number,
): RoadmapStage | undefined {
  if (monthIndex < 1 || roadmap.length === 0) return undefined
  return roadmap[monthIndex - 1] ?? roadmap[roadmap.length - 1]
}

/** Takvim gününün yol haritası ay indeksi (1-tabanlı). */
export function roadmapMonthIndexForDate(
  startAt: Date,
  totalMonths: number,
  date: Date,
): number {
  return currentMonthIndex(startAt, totalMonths, date)
}

/** Yol haritası ay N'nin takvim ayı başlangıcı. */
export function calendarMonthStartForRoadmapMonth(startAt: Date, roadmapMonth: number): Date {
  return new Date(startAt.getFullYear(), startAt.getMonth() + (roadmapMonth - 1), 1)
}

/**
 * Aylık huniden dönem günü sayısına orantılı hedef (26 iş günü modeli).
 * Günlük = days 1; haftalık = days 7 (ay sınırında parçalanır).
 */
export function prorateMonthlyTargets(monthly: FunnelCounts, days: number): FunnelCounts {
  if (days <= 0) return { ...EMPTY_FUNNEL }
  const scale = (n: number) => Math.max(0, Math.ceil((n * days) / WORKING_DAYS_PER_MONTH))
  return {
    arama: scale(monthly.arama),
    tanisma: scale(monthly.tanisma),
    sunum: scale(monthly.sunum),
    yeniUye: scale(monthly.yeniUye),
  }
}

/** Tek takvim günü — o günün yol haritası kademesi (dün/yarın dahil). */
export function funnelTargetsForCalendarDay(ctx: GoalFunnelContext, date: Date): FunnelCounts {
  const idx = roadmapMonthIndexForDate(ctx.startAt, ctx.targetMonths, date)
  const stage = stageForRoadmapMonth(ctx.roadmap, idx)
  if (!stage) return { ...EMPTY_FUNNEL }
  return prorateMonthlyTargets(stage.monthly, 1)
}

/** Takvim haftası — kademe sınırında günler ayrı oranlanır. */
export function funnelTargetsForCalendarWeek(
  ctx: GoalFunnelContext,
  startDate: Date,
  endDate: Date,
): FunnelCounts {
  const daysByMonth = new Map<number, number>()
  // setHours: yerel gün döngüsü; ay-bazlı sayım (gün anahtarı değil) → TZ etkisiz.
  const cursor = new Date(startDate)
  cursor.setHours(0, 0, 0, 0)
  const end = new Date(endDate)
  end.setHours(0, 0, 0, 0)

  while (cursor <= end) {
    const idx = roadmapMonthIndexForDate(ctx.startAt, ctx.targetMonths, cursor)
    daysByMonth.set(idx, (daysByMonth.get(idx) ?? 0) + 1)
    cursor.setDate(cursor.getDate() + 1)
  }

  let total = { ...EMPTY_FUNNEL }
  for (const [monthIdx, dayCount] of daysByMonth) {
    const stage = stageForRoadmapMonth(ctx.roadmap, monthIdx)
    if (stage) total = addFunnel(total, prorateMonthlyTargets(stage.monthly, dayCount))
  }
  return total
}

/** Takvim ayı — Hedefim yol haritası satırındaki stage.monthly ile birebir. */
export function funnelTargetsForCalendarMonth(ctx: GoalFunnelContext, monthStart: Date): FunnelCounts {
  const ref = new Date(monthStart.getFullYear(), monthStart.getMonth(), 15)
  const idx = roadmapMonthIndexForDate(ctx.startAt, ctx.targetMonths, ref)
  const stage = stageForRoadmapMonth(ctx.roadmap, idx)
  return stage ? { ...stage.monthly } : { ...EMPTY_FUNNEL }
}

/** Takvim yılı — o yıla düşen yol haritası aylarının monthly toplamı. */
export function funnelTargetsForCalendarYear(ctx: GoalFunnelContext, year: number): FunnelCounts {
  let total = { ...EMPTY_FUNNEL }
  for (const stage of ctx.roadmap) {
    const calMonth = calendarMonthStartForRoadmapMonth(ctx.startAt, stage.month)
    if (calMonth.getFullYear() === year) {
      total = addFunnel(total, stage.monthly)
    }
  }
  return total
}

/** İstanbul hizalı takvim aralığı — yol haritası ay sınırında günler ayrı oranlanır. */
export function funnelTargetsForDateRange(
  ctx: GoalFunnelContext,
  startDate: Date,
  endDate: Date,
): FunnelCounts {
  return funnelTargetsForCalendarWeek(ctx, startDate, endDate)
}

/**
 * İstatistikler / ekip aktivite sheet — PulsePeriod hedefleri (gerçekleşen penceresi ile aynı).
 * Günlük = bugünün kademesi; 7g/30g = kayan pencerede günlük oran toplamı; ytd = takvim yılı; all = hedef yok.
 */
export function funnelTargetsForPulsePeriod(
  ctx: GoalFunnelContext,
  period: PulsePeriod,
): FunnelCounts {
  if (period === 'all') return { ...EMPTY_FUNNEL }

  const range = funnelRangeForPulsePeriod(period)
  const end = fromCalendarKey(range.endCalendarKey)

  if (period === 'today') {
    return funnelTargetsForCalendarDay(ctx, end)
  }
  if (period === 'ytd') {
    return funnelTargetsForCalendarYear(ctx, end.getFullYear())
  }

  const start = fromCalendarKey(range.startCalendarKey)
  return funnelTargetsForDateRange(ctx, start, end)
}

/** Kullanıcı hedefi + yol haritası → Saha huni hedef hesapları için bağlam. */
export function goalPayloadToFunnelContext(
  goal: { targetMonths: number; startAt: string },
  roadmap: RoadmapStage[],
): GoalFunnelContext {
  return {
    startAt: new Date(goal.startAt),
    targetMonths: goal.targetMonths,
    roadmap,
  }
}
