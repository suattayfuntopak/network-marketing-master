'use client'

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { parsePeriodOffset } from '@/lib/utils/hubPeriodRange'
import { parseSummaryTab, type HubPeriodTab } from '@/lib/domain/hubPeriodPrefetch'

/**
 * Hub dönem gezintisi — TAMAMEN istemci tarafı state. Sekme/offset değişimi artık
 * `router.replace` ile RSC turu (sunucuya ~15 sorgu, saniyelerce blok) TETİKLEMEZ;
 * yalnızca `window.history.replaceState` ile URL'i paylaşılabilir tutar. Böylece
 * Ekibim > Aktivite sekmesi gibi "pat pat" hızında geçişler olur (metrikler
 * TanStack önbelleğinden anında gelir). İlk URL değerleri SSR'dan seed edilir.
 */
type HubPeriodCtx = {
  offset: number
  tab: HubPeriodTab
  go: (toOffset: number) => void
  setTab: (tab: HubPeriodTab) => void
  goToCurrentPeriod: () => void
}

const Ctx = createContext<HubPeriodCtx | null>(null)

export function HubPeriodProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Yalnızca ilk render'da URL'den seed et; sonrası istemci state'i yönetir.
  const [tab, setTabState] = useState<HubPeriodTab>(() => parseSummaryTab(searchParams.get('tab')))
  const [offset, setOffsetState] = useState<number>(() => parsePeriodOffset(searchParams.get('offset')))

  const syncUrl = useCallback(
    (nextTab: HubPeriodTab, nextOffset: number) => {
      if (typeof window === 'undefined') return
      const params = new URLSearchParams()
      params.set('tab', nextTab)
      if (nextOffset !== 0) params.set('offset', String(nextOffset))
      window.history.replaceState(null, '', `${pathname}?${params.toString()}`)
    },
    [pathname],
  )

  const go = useCallback(
    (toOffset: number) => {
      setOffsetState(toOffset)
      syncUrl(tab, toOffset)
    },
    [syncUrl, tab],
  )

  const setTab = useCallback(
    (next: HubPeriodTab) => {
      // Sekme değişince offset sıfırlanır (bu döneme dön).
      setTabState(next)
      setOffsetState(0)
      syncUrl(next, 0)
    },
    [syncUrl],
  )

  const goToCurrentPeriod = useCallback(() => go(0), [go])

  return createElement(
    Ctx.Provider,
    { value: { offset, tab, go, setTab, goToCurrentPeriod } },
    children,
  )
}

export function useHubPeriodNavigation(): HubPeriodCtx {
  const ctx = useContext(Ctx)
  if (!ctx) {
    throw new Error('useHubPeriodNavigation must be used within <HubPeriodProvider>')
  }
  return ctx
}
