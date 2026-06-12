import { describe, it, expect } from 'vitest'
import { computeRoadmap } from '@/lib/domain/roadmap'
import {
  funnelTargetsForCalendarDay,
  funnelTargetsForCalendarMonth,
  funnelTargetsForCalendarWeek,
  funnelTargetsForCalendarYear,
  prorateMonthlyTargets,
  type GoalFunnelContext,
} from '@/lib/domain/hubFunnelTargets'

function ctxFor300x18(team = 4): GoalFunnelContext {
  const startAt = new Date(2026, 5, 1) // Haziran 2026
  return {
    startAt,
    targetMonths: 18,
    roadmap: computeRoadmap(300, 18, team),
  }
}

describe('hubFunnelTargets', () => {
  it('günlük hedef = ceil(aylık/26) — 1. ay', () => {
    const ctx = ctxFor300x18()
    const day = new Date(2026, 5, 12)
    expect(funnelTargetsForCalendarDay(ctx, day)).toEqual({
      arama: 1,
      tanisma: 1,
      sunum: 1,
      yeniUye: 1,
    })
  })

  it('aylık hedef = yol haritası stage.monthly — Hedefim satırı ile aynı', () => {
    const ctx = ctxFor300x18()
    const monthStart = new Date(2026, 5, 1)
    expect(funnelTargetsForCalendarMonth(ctx, monthStart)).toEqual({
      arama: 18,
      tanisma: 9,
      sunum: 3,
      yeniUye: 1,
    })
  })

  it('haftalık hedef = ceil(aylık×7/26), günlük×7 değil', () => {
    const monthly = { arama: 18, tanisma: 9, sunum: 3, yeniUye: 1 }
    expect(prorateMonthlyTargets(monthly, 7)).toEqual({
      arama: 5,
      tanisma: 3,
      sunum: 1,
      yeniUye: 1,
    })
    const ctx = ctxFor300x18()
    const mon = new Date(2026, 5, 8)
    const sun = new Date(2026, 5, 14)
    expect(funnelTargetsForCalendarWeek(ctx, mon, sun)).toEqual(prorateMonthlyTargets(monthly, 7))
  })

  it('geçmiş takvim ayı o dönemin kademe hedefini kullanır', () => {
    const ctx = ctxFor300x18()
    // 4. yol haritası ayı = Eylül 2026 (18+3=21. ay değil — start Haziran +3 = Eylül)
    const september = new Date(2026, 8, 1)
    const stage4 = ctx.roadmap[3]
    expect(funnelTargetsForCalendarMonth(ctx, september)).toEqual(stage4.monthly)
    expect(stage4.monthly.arama).toBe(36)
  })

  it('yıllık hedef = o yıldaki yol haritası aylarının toplamı', () => {
    const ctx = ctxFor300x18()
    const year2026 = funnelTargetsForCalendarYear(ctx, 2026)
    const expected = ctx.roadmap
      .filter(s => {
        const m = new Date(ctx.startAt.getFullYear(), ctx.startAt.getMonth() + s.month - 1, 1)
        return m.getFullYear() === 2026
      })
      .reduce(
        (acc, s) => ({
          arama: acc.arama + s.monthly.arama,
          tanisma: acc.tanisma + s.monthly.tanisma,
          sunum: acc.sunum + s.monthly.sunum,
          yeniUye: acc.yeniUye + s.monthly.yeniUye,
        }),
        { arama: 0, tanisma: 0, sunum: 0, yeniUye: 0 },
      )
    expect(year2026).toEqual(expected)
    expect(year2026.arama).toBeGreaterThan(18)
  })
})
