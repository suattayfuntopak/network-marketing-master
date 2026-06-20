import { PRODUCT_EVENTS } from '@/lib/domain/productEvents'
import type { ProUpgradeCtaSource } from '@/lib/domain/planFeatureMatrix'

export type ProductFunnelRow = {
  event_name: string
  metadata: Record<string, unknown> | null
}

export type ProductFunnelCounts = {
  pricingSectionView: number
  upgradeGateCtaClick: number
  odemeBasicDeepLink: number
  odemePlusDeepLink: number
  odemePageView: number
  seePlansClick: number
  seePlansClickAccountAlert: number
  seePlansClickUpgradeGate: number
  seePlansClickNotification: number
  seePlansClickTrial: number
  seePlansClickEnded: number
  proUpgradeCtaClick: number
  proUpgradeCtaUpgradeGate: number
  proUpgradeCtaEkipSummary: number
  proUpgradeCtaEkipTraining: number
  proUpgradeCtaStatsHint: number
}

export function emptyProductFunnelCounts(): ProductFunnelCounts {
  return {
    pricingSectionView: 0,
    upgradeGateCtaClick: 0,
    odemeBasicDeepLink: 0,
    odemePlusDeepLink: 0,
    odemePageView: 0,
    seePlansClick: 0,
    seePlansClickAccountAlert: 0,
    seePlansClickUpgradeGate: 0,
    seePlansClickNotification: 0,
    seePlansClickTrial: 0,
    seePlansClickEnded: 0,
    proUpgradeCtaClick: 0,
    proUpgradeCtaUpgradeGate: 0,
    proUpgradeCtaEkipSummary: 0,
    proUpgradeCtaEkipTraining: 0,
    proUpgradeCtaStatsHint: 0,
  }
}

const PRO_UPGRADE_SOURCES: ProUpgradeCtaSource[] = [
  'upgrade_gate',
  'ekip_summary',
  'ekip_training',
  'stats_hint',
]

function isProUpgradeSource(value: unknown): value is ProUpgradeCtaSource {
  return typeof value === 'string' && PRO_UPGRADE_SOURCES.includes(value as ProUpgradeCtaSource)
}

/** Süper admin hunisi — nmm_product_events satırlarından sayım. */
export function aggregateProductFunnelCounts(rows: ProductFunnelRow[]): ProductFunnelCounts {
  const counts = emptyProductFunnelCounts()
  for (const row of rows) {
    const meta = row.metadata
    if (row.event_name === PRODUCT_EVENTS.pricingSectionView) counts.pricingSectionView++
    else if (row.event_name === PRODUCT_EVENTS.upgradeGateCtaClick) counts.upgradeGateCtaClick++
    else if (row.event_name === PRODUCT_EVENTS.odemeBasicDeepLink) counts.odemeBasicDeepLink++
    else if (row.event_name === PRODUCT_EVENTS.odemePlusDeepLink) counts.odemePlusDeepLink++
    else if (row.event_name === PRODUCT_EVENTS.odemePageView) counts.odemePageView++
    else if (row.event_name === PRODUCT_EVENTS.seePlansClick) {
      counts.seePlansClick++
      const source = meta?.source
      const phase = meta?.phase
      if (source === 'account_alert') counts.seePlansClickAccountAlert++
      else if (source === 'upgrade_gate') counts.seePlansClickUpgradeGate++
      else if (source === 'notification') counts.seePlansClickNotification++
      if (phase === 'trial') counts.seePlansClickTrial++
      else if (phase === 'ended') counts.seePlansClickEnded++
    } else if (row.event_name === PRODUCT_EVENTS.proUpgradeCtaClick) {
      counts.proUpgradeCtaClick++
      const source = meta?.source
      if (source === 'upgrade_gate') counts.proUpgradeCtaUpgradeGate++
      else if (source === 'ekip_summary') counts.proUpgradeCtaEkipSummary++
      else if (source === 'ekip_training') counts.proUpgradeCtaEkipTraining++
      else if (source === 'stats_hint') counts.proUpgradeCtaStatsHint++
      else if (isProUpgradeSource(source)) {
        // bilinmeyen gelecekteki kaynak — toplam sayıldı, kırılım yok
      }
    }
  }
  return counts
}
