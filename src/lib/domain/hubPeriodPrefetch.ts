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

const HUB_ACTIVE_TAB_STORAGE_KEY = 'nmm_hub_active_tab'

/** Son ziyaret edilen Saha Özetim sekmesi — nav hover prefetch için. */
export function readStoredHubActiveTab(): HubPeriodTab | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    const raw = sessionStorage.getItem(HUB_ACTIVE_TAB_STORAGE_KEY)
    if (!raw) return undefined
    const parsed = parseSummaryTab(raw)
    return parsed
  } catch {
    return undefined
  }
}

export function writeStoredHubActiveTab(tab: HubPeriodTab): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(HUB_ACTIVE_TAB_STORAGE_KEY, tab)
  } catch {
    /* ignore quota / private mode */
  }
}

/** Hover prefetch maliyetini development/preview'da konsola yazar. */
export function shouldLogHubPrefetch(): boolean {
  if (process.env.NODE_ENV === 'development') return true
  return process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview'
}
