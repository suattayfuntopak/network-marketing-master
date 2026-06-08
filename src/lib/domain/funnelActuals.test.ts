import { describe, expect, it } from 'vitest'
import { sumFunnelDays } from '@/lib/domain/funnelActuals'
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
