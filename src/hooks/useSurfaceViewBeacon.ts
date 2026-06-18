'use client'

import { useEffect, useRef } from 'react'
import { logProductEventAction } from '@/app/(dashboard)/_shared-actions/productEvents'
import { PRODUCT_EVENTS } from '@/lib/domain/productEvents'
import { getAnalyticsSessionId } from '@/lib/utils/analyticsSession'

/** Faz F: ölçülen "performans/özet" yüzeyleri — pathname öneki → etiket. */
const TRACKED_SURFACES: ReadonlyArray<{ prefix: string; surface: string }> = [
  { prefix: '/pano', surface: 'pano' },
  { prefix: '/saha-ozetim', surface: 'saha-ozetim' },
  { prefix: '/saha-radar', surface: 'saha-radar' },
  { prefix: '/istatistikler', surface: 'istatistikler' },
  { prefix: '/hedefim', surface: 'hedefim' },
]

function resolveSurface(pathname: string): string | null {
  for (const { prefix, surface } of TRACKED_SURFACES) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) return surface
  }
  return null
}

/**
 * Faz F: izlenen bir performans yüzeyine her GİRİŞTE (pathname değişimi) bir
 * `surface_view` ürün olayı gönderir — 6 yüzeyin göreli trafiğini ölçmek için
 * (konsolidasyon kararı veriyle alınır, kör kesme yok).
 *
 * `lastFired` her pathname için güncellenir → ara rotadan aynı yüzeye dönüş yeni
 * görüntüleme sayılır; salt re-render (aynı pathname) tekrar saymaz.
 */
export function useSurfaceViewBeacon(pathname: string, enabled: boolean): void {
  const lastFired = useRef<string | null>(null)

  useEffect(() => {
    if (!enabled) return
    if (lastFired.current === pathname) return
    lastFired.current = pathname

    const surface = resolveSurface(pathname)
    if (!surface) return

    void logProductEventAction(
      PRODUCT_EVENTS.surfaceView,
      { surface },
      getAnalyticsSessionId(),
    )
  }, [pathname, enabled])
}
