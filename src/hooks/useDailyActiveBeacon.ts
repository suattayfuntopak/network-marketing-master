'use client'

import { useEffect, useRef } from 'react'
import { logProductEventAction } from '@/app/(dashboard)/_shared-actions/productEvents'
import { PRODUCT_EVENTS } from '@/lib/domain/productEvents'
import { getAnalyticsSessionId } from '@/lib/utils/analyticsSession'
import { todayCalendarKey } from '@/lib/utils/calendarDates'

const STORAGE_PREFIX = 'nmm_daily_active_'

/**
 * Günde bir kez `daily_active` ürün olayı gönderir (İstanbul gün anahtarı).
 * D1/D7/D30 retention, DAU/MAU ve streak KPI'larının tek kaynağı — bu olay
 * birikmeden bu metrikler hesaplanamaz. localStorage gün-anahtarı guard'ı ile
 * aynı gün tekrar tekrar tetiklenmez (sayfa geçişleri olayı çoğaltmaz).
 */
export function useDailyActiveBeacon(enabled: boolean): void {
  const firedRef = useRef(false)

  useEffect(() => {
    if (!enabled || firedRef.current) return
    if (typeof window === 'undefined') return

    const dayKey = todayCalendarKey()
    const storageKey = `${STORAGE_PREFIX}${dayKey}`

    let already = false
    try {
      already = window.localStorage.getItem(storageKey) === '1'
    } catch {
      // localStorage erişilemiyorsa (gizli sekme vb.) sessizce devam et
    }
    if (already) {
      firedRef.current = true
      return
    }

    firedRef.current = true
    try {
      window.localStorage.setItem(storageKey, '1')
      // Eski gün anahtarlarını temizle — tek günün kaydı kalır.
      for (let i = window.localStorage.length - 1; i >= 0; i--) {
        const k = window.localStorage.key(i)
        if (k && k.startsWith(STORAGE_PREFIX) && k !== storageKey) {
          window.localStorage.removeItem(k)
        }
      }
    } catch {
      // yazılamazsa yine de olayı gönder (en kötü ihtimalle gün içi tekrar)
    }

    void logProductEventAction(
      PRODUCT_EVENTS.dailyActive,
      { day: dayKey },
      getAnalyticsSessionId(),
    )
  }, [enabled])
}
