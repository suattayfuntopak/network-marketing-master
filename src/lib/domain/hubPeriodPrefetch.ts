/** Saha Özetim dönem sekmeleri — sunucu prefetch + istemci paylaşımlı. */

export const HUB_PERIOD_TABS = ['daily', 'weekly', 'monthly', 'yearly'] as const
export type HubPeriodTab = (typeof HUB_PERIOD_TABS)[number]

/** Dönem şeridi swipe/ok ile komşu günler/haftalar için önbellek offset'leri. */
export const HUB_PERIOD_NEIGHBOR_OFFSETS = [-1, 0, 1] as const

export function parseSummaryTab(raw: string | null): HubPeriodTab {
  if (raw === 'all') return 'yearly'
  if (raw && (HUB_PERIOD_TABS as readonly string[]).includes(raw)) {
    return raw as HubPeriodTab
  }
  return 'daily'
}

/** activeTab yoksa (hover) yalnızca 0; aktif sekmede komşu offset'ler. */
export function hubPeriodOffsetsForPrefetch(
  activeTab: HubPeriodTab | undefined,
  period: HubPeriodTab,
): readonly number[] {
  if (!activeTab) return [0]
  if (activeTab === period) return HUB_PERIOD_NEIGHBOR_OFFSETS
  return [0]
}
