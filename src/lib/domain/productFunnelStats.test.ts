import { describe, expect, it } from 'vitest'
import { PRODUCT_EVENTS } from '@/lib/domain/productEvents'
import {
  aggregateProductFunnelCounts,
  computeProductFunnelRates,
  emptyProductFunnelCounts,
  type ProductFunnelRow,
} from '@/lib/domain/productFunnelStats'

describe('productFunnelStats', () => {
  it('emptyProductFunnelCounts returns zeroed counters', () => {
    const counts = emptyProductFunnelCounts()
    for (const value of Object.values(counts)) {
      expect(value).toBe(0)
    }
  })

  it('aggregateProductFunnelCounts tallies core funnel events', () => {
    const rows: ProductFunnelRow[] = [
      { event_name: PRODUCT_EVENTS.pricingSectionView, metadata: null },
      { event_name: PRODUCT_EVENTS.odemePageView, metadata: null },
      { event_name: PRODUCT_EVENTS.odemePlusDeepLink, metadata: { source: 'query' } },
      { event_name: PRODUCT_EVENTS.upgradeGateCtaClick, metadata: null },
    ]
    const counts = aggregateProductFunnelCounts(rows)
    expect(counts.pricingSectionView).toBe(1)
    expect(counts.odemePageView).toBe(1)
    expect(counts.odemePlusDeepLink).toBe(1)
    expect(counts.upgradeGateCtaClick).toBe(1)
  })

  it('aggregateProductFunnelCounts breaks down seePlansClick by source and phase', () => {
    const rows: ProductFunnelRow[] = [
      {
        event_name: PRODUCT_EVENTS.seePlansClick,
        metadata: { source: 'account_alert', phase: 'trial' },
      },
      {
        event_name: PRODUCT_EVENTS.seePlansClick,
        metadata: { source: 'upgrade_gate', phase: 'ended' },
      },
      {
        event_name: PRODUCT_EVENTS.seePlansClick,
        metadata: { source: 'notification', phase: 'trial' },
      },
    ]
    const counts = aggregateProductFunnelCounts(rows)
    expect(counts.seePlansClick).toBe(3)
    expect(counts.seePlansClickAccountAlert).toBe(1)
    expect(counts.seePlansClickUpgradeGate).toBe(1)
    expect(counts.seePlansClickNotification).toBe(1)
    expect(counts.seePlansClickTrial).toBe(2)
    expect(counts.seePlansClickEnded).toBe(1)
  })

  it('aggregateProductFunnelCounts breaks down proUpgradeCtaClick by source', () => {
    const rows: ProductFunnelRow[] = [
      {
        event_name: PRODUCT_EVENTS.proUpgradeCtaClick,
        metadata: { source: 'upgrade_gate' },
      },
      {
        event_name: PRODUCT_EVENTS.proUpgradeCtaClick,
        metadata: { source: 'ekip_summary' },
      },
      {
        event_name: PRODUCT_EVENTS.proUpgradeCtaClick,
        metadata: { source: 'ekip_training' },
      },
      {
        event_name: PRODUCT_EVENTS.proUpgradeCtaClick,
        metadata: { source: 'stats_hint' },
      },
    ]
    const counts = aggregateProductFunnelCounts(rows)
    expect(counts.proUpgradeCtaClick).toBe(4)
    expect(counts.proUpgradeCtaUpgradeGate).toBe(1)
    expect(counts.proUpgradeCtaEkipSummary).toBe(1)
    expect(counts.proUpgradeCtaEkipTraining).toBe(1)
    expect(counts.proUpgradeCtaStatsHint).toBe(1)
  })

  it('computeProductFunnelRates derives conversion percentages', () => {
    const counts = emptyProductFunnelCounts()
    counts.pricingSectionView = 100
    counts.seePlansClick = 25
    counts.odemePageView = 5
    const rates = computeProductFunnelRates(counts)
    expect(rates.seePlansFromLandingPct).toBe(25)
    expect(rates.odemeFromSeePlansPct).toBe(20)
    expect(computeProductFunnelRates(emptyProductFunnelCounts()).seePlansFromLandingPct).toBeNull()
  })
})
