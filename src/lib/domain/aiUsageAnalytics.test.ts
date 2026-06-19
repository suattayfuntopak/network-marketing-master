import { describe, it, expect } from 'vitest'
import { aggregateAiUsage, type AiUsageWorkspaceInput } from './aiUsageAnalytics'

describe('aggregateAiUsage', () => {
  it('boş girdi → sıfır gruplar', () => {
    const a = aggregateAiUsage([], 30)
    expect(a.totalWorkspaces).toBe(0)
    expect(a.overall.workspaceCount).toBe(0)
    expect(a.overall.avgDailyPerUser).toBe(0)
    expect(a.byTier).toEqual([])
    expect(a.bySegment).toEqual([])
  })

  it('genel ortalama/medyan/p90 günlük oranı doğru hesaplar', () => {
    // 30 günlük pencere; actionCount → daily = count/30
    const rows: AiUsageWorkspaceInput[] = [
      { tier: 'pro', isIndependent: false, actionCount: 300 }, // 10/gün
      { tier: 'plus', isIndependent: false, actionCount: 150 }, // 5/gün
      { tier: 'basic', isIndependent: false, actionCount: 30 }, // 1/gün
      { tier: 'free', isIndependent: true, actionCount: 0 }, // 0/gün
    ]
    const a = aggregateAiUsage(rows, 30)
    expect(a.totalWorkspaces).toBe(4)
    expect(a.overall.workspaceCount).toBe(4)
    expect(a.overall.activeCount).toBe(3)
    expect(a.overall.totalActions).toBe(480)
    // dailyRates sorted: [0, 1, 5, 10] → avg = 4
    expect(a.overall.avgDailyPerUser).toBe(4)
    // median of [0,1,5,10] = (1+5)/2 = 3
    expect(a.overall.medianDailyPerUser).toBe(3)
    // p90 nearest-rank: ceil(0.9*4)=4 → idx 3 → 10
    expect(a.overall.p90DailyPerUser).toBe(10)
    // avgTotalPerUser = 480/4 = 120
    expect(a.overall.avgTotalPerUser).toBe(120)
  })

  it('kademe ve segment kırılımı yalnız mevcut grupları döndürür', () => {
    const rows: AiUsageWorkspaceInput[] = [
      { tier: 'pro', isIndependent: false, actionCount: 60 }, // team, 2/gün
      { tier: 'pro', isIndependent: true, actionCount: 30 }, // independent, 1/gün
    ]
    const a = aggregateAiUsage(rows, 30)
    expect(a.byTier.map(g => g.tier)).toEqual(['pro'])
    expect(a.byTier[0].stat.workspaceCount).toBe(2)
    expect(a.bySegment.map(g => g.segment).sort()).toEqual(['independent', 'team'])
    const team = a.bySegment.find(g => g.segment === 'team')!
    const indep = a.bySegment.find(g => g.segment === 'independent')!
    expect(team.stat.totalActions).toBe(60)
    expect(indep.stat.totalActions).toBe(30)
  })

  it('windowDays=0 güvenli (1 gibi davranır, NaN/Infinity yok)', () => {
    const a = aggregateAiUsage([{ tier: 'free', isIndependent: true, actionCount: 5 }], 0)
    expect(Number.isFinite(a.overall.avgDailyPerUser)).toBe(true)
    expect(a.overall.avgDailyPerUser).toBe(5)
  })
})
