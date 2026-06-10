import { describe, it, expect } from 'vitest'
import {
  hubPeriodOffsetsForPrefetch,
  HUB_PERIOD_NEIGHBOR_OFFSETS,
  parseSummaryTab,
} from './hubPeriodPrefetch'

describe('hubPeriodPrefetch', () => {
  it('parseSummaryTab defaults to daily', () => {
    expect(parseSummaryTab(null)).toBe('daily')
    expect(parseSummaryTab('weekly')).toBe('weekly')
    expect(parseSummaryTab('all')).toBe('yearly')
  })

  it('hubPeriodOffsetsForPrefetch without active tab only prefetches offset 0', () => {
    expect(hubPeriodOffsetsForPrefetch(undefined, 'daily')).toEqual([0])
    expect(hubPeriodOffsetsForPrefetch(undefined, 'yearly')).toEqual([0])
  })

  it('hubPeriodOffsetsForPrefetch with active tab prefetches neighbors for that period only', () => {
    expect(hubPeriodOffsetsForPrefetch('daily', 'daily')).toEqual(HUB_PERIOD_NEIGHBOR_OFFSETS)
    expect(hubPeriodOffsetsForPrefetch('daily', 'weekly')).toEqual([0])
    expect(hubPeriodOffsetsForPrefetch('monthly', 'monthly')).toEqual([-1, 0, 1])
  })
})
