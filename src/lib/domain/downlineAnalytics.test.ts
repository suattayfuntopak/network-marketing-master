import { describe, it, expect } from 'vitest'
import { computeDownlineAnalytics, type DownlineAnalyticsNode } from '@/lib/domain/downlineAnalytics'

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
