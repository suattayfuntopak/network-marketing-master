import { describe, it, expect, vi } from 'vitest'
import {
  hubPeriodOffsetsForPrefetch,
  HUB_PERIOD_NEIGHBOR_OFFSETS,
  parseSummaryTab,
  readStoredHubActiveTab,
  writeStoredHubActiveTab,
} from './hubPeriodPrefetch'

describe('hubPeriodPrefetch', () => {
  it('parseSummaryTab defaults to daily', () => {
    expect(parseSummaryTab(null)).toBe('daily')
    expect(parseSummaryTab('weekly')).toBe('weekly')
    expect(parseSummaryTab('all')).toBe('all') // Tüm Zamanlar artık gerçek bir sekme
    expect(parseSummaryTab('bilinmeyen')).toBe('daily')
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

  it('writeStoredHubActiveTab persists for hover prefetch', () => {
    const store: Record<string, string> = {}
    const sessionStorage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v
      },
    }
    vi.stubGlobal('window', {})
    vi.stubGlobal('sessionStorage', sessionStorage)
    writeStoredHubActiveTab('weekly')
    expect(readStoredHubActiveTab()).toBe('weekly')
    vi.unstubAllGlobals()
  })
})
