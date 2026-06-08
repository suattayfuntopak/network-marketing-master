import { describe, expect, it } from 'vitest'
import { funnelRangeForPulsePeriod, sumFunnelDays } from '@/lib/domain/funnelActuals'
import type { FunnelCounts } from '@/lib/domain/roadmap'

describe('sumFunnelDays', () => {
  it('sums action buckets across days', () => {
    const actions = new Map<string, FunnelCounts>([
      ['2026-06-08', { arama: 4, tanisma: 0, sunum: 0, yeniUye: 0 }],
      ['2026-06-09', { arama: 2, tanisma: 1, sunum: 0, yeniUye: 0 }],
    ])
    const result = sumFunnelDays(['2026-06-08', '2026-06-09'], actions)
    expect(result.arama).toBe(6)
    expect(result.tanisma).toBe(1)
  })

  it('treats missing days as zero', () => {
    const result = sumFunnelDays(['2026-06-10'], new Map())
    expect(result).toEqual({ arama: 0, tanisma: 0, sunum: 0, yeniUye: 0 })
  })
})

describe('funnelRangeForPulsePeriod', () => {
  it('today is a single calendar day', () => {
    const range = funnelRangeForPulsePeriod('today')
    expect(range.startCalendarKey).toBe(range.endCalendarKey)
  })

  it('7d spans seven inclusive days', () => {
    const range = funnelRangeForPulsePeriod('7d')
    const start = new Date(`${range.startCalendarKey}T12:00:00`)
    const end = new Date(`${range.endCalendarKey}T12:00:00`)
    const diffDays = Math.round((end.getTime() - start.getTime()) / 86_400_000)
    expect(diffDays).toBe(6)
  })
})
