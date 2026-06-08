import { describe, expect, it } from 'vitest'
import { mergeFunnelDays, fieldLogRowToFunnel } from '@/lib/domain/funnelActuals'
import type { FunnelCounts } from '@/lib/domain/roadmap'

describe('mergeFunnelDays', () => {
  it('uses field_log for days with manual entry', () => {
    const fieldLog = new Map<string, FunnelCounts>([
      ['2026-06-08', fieldLogRowToFunnel({ calls: 5, contacts: 2, presentations: 1, new_members: 0 })],
    ])
    const actions = new Map<string, FunnelCounts>([
      ['2026-06-08', { arama: 1, tanisma: 0, sunum: 0, yeniUye: 0 }],
    ])
    const result = mergeFunnelDays(['2026-06-08'], fieldLog, actions)
    expect(result.arama).toBe(5)
    expect(result.tanisma).toBe(2)
  })

  it('falls back to actions when no field_log for that day', () => {
    const actions = new Map<string, FunnelCounts>([
      ['2026-06-09', { arama: 3, tanisma: 1, sunum: 2, yeniUye: 0 }],
    ])
    const result = mergeFunnelDays(['2026-06-09'], new Map(), actions)
    expect(result).toEqual({ arama: 3, tanisma: 1, sunum: 2, yeniUye: 0 })
  })

  it('sums merged days across a week', () => {
    const fieldLog = new Map<string, FunnelCounts>([
      ['2026-06-08', fieldLogRowToFunnel({ calls: 4, contacts: 0, presentations: 0, new_members: 0 })],
    ])
    const actions = new Map<string, FunnelCounts>([
      ['2026-06-09', { arama: 2, tanisma: 1, sunum: 0, yeniUye: 0 }],
    ])
    const result = mergeFunnelDays(['2026-06-08', '2026-06-09'], fieldLog, actions)
    expect(result.arama).toBe(6)
    expect(result.tanisma).toBe(1)
  })
})
