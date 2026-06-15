import { describe, it, expect } from 'vitest'
import { computeDownlineAnalytics, monthlyJoinCohorts, type DownlineAnalyticsNode } from '@/lib/domain/downlineAnalytics'

const NOW = new Date('2026-06-15T12:00:00Z').getTime()
const daysAgo = (d: number) => new Date(NOW - d * 24 * 60 * 60 * 1000).toISOString()

const n = (generation: number, joinedAt: string | null = null): DownlineAnalyticsNode => ({ generation, joinedAt })

describe('computeDownlineAnalytics', () => {
  it('boş / yalnız lider → sıfır', () => {
    const r = computeDownlineAnalytics([n(0)], NOW)
    expect(r.totalMembers).toBe(0)
    expect(r.depth).toBe(0)
    expect(r.biggestGeneration).toBeNull()
    expect(r.perGeneration).toEqual([])
  })

  it('lideri saymaz, downline sayar', () => {
    const r = computeDownlineAnalytics([n(0), n(1), n(1), n(2)], NOW)
    expect(r.totalMembers).toBe(3)
    expect(r.depth).toBe(2)
  })

  it('jenerasyon dağılımı artan sırada', () => {
    const r = computeDownlineAnalytics([n(2), n(1), n(1), n(3)], NOW)
    expect(r.perGeneration).toEqual([
      { generation: 1, count: 2 },
      { generation: 2, count: 1 },
      { generation: 3, count: 1 },
    ])
  })

  it('en kalabalık jenerasyon (eşitlikte en düşük)', () => {
    const r = computeDownlineAnalytics([n(1), n(1), n(2), n(2), n(3)], NOW)
    expect(r.biggestGeneration).toEqual({ generation: 1, count: 2 })
  })

  it('son 30 günde katılanları sayar', () => {
    const r = computeDownlineAnalytics(
      [n(1, daysAgo(5)), n(1, daysAgo(40)), n(2, daysAgo(29)), n(2, null)],
      NOW,
    )
    expect(r.joinedLast30).toBe(2)
  })

  it('gelecekteki/geçersiz joinedAt 30-gün sayımına girmez', () => {
    const future = new Date(NOW + 5 * 24 * 60 * 60 * 1000).toISOString()
    const r = computeDownlineAnalytics([n(1, future), n(1, 'bozuk-tarih')], NOW)
    expect(r.joinedLast30).toBe(0)
  })
})

describe('monthlyJoinCohorts', () => {
  it('son 6 ay, eskiden yeniye, boş aylar 0', () => {
    const r = monthlyJoinCohorts(
      [n(1, '2026-05-10T09:00:00Z'), n(1, '2026-05-20T09:00:00Z'), n(1, '2026-06-02T09:00:00Z')],
      NOW,
    )
    expect(r.map(c => c.month)).toEqual(['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'])
    expect(r.find(c => c.month === '2026-05')?.count).toBe(2)
    expect(r.find(c => c.month === '2026-06')?.count).toBe(1)
    expect(r.find(c => c.month === '2026-03')?.count).toBe(0)
  })

  it('pencere dışı (6 aydan eski) kohort dahil edilmez', () => {
    const r = monthlyJoinCohorts([n(1, '2025-11-01T09:00:00Z')], NOW)
    expect(r.reduce((s, c) => s + c.count, 0)).toBe(0)
  })

  it('lider (gen 0) ve joinedAt yok sayılır', () => {
    const r = monthlyJoinCohorts([n(0, '2026-06-01T09:00:00Z'), n(1, null)], NOW)
    expect(r.reduce((s, c) => s + c.count, 0)).toBe(0)
  })
})
