'use client'

import { useEffect } from 'react'

/** Production'da hafif PWA service worker kaydı. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return

    const buildId = process.env.NEXT_PUBLIC_BUILD_ID ?? 'dev'

    void (async () => {
      try {
        const regs = await navigator.serviceWorker.getRegistrations()
        for (const reg of regs) {
          if (reg.active?.scriptURL.includes('/sw.js')) {
            await reg.unregister()
          }
        }
      } catch {
        /* eski bozuk SW temizlenemezse sessiz */
      }

      try {
        await navigator.serviceWorker.register(`/sw.js?v=${buildId}`, { scope: '/' })
      } catch {
        /* SW desteklenmiyorsa sessiz kal */
      }
    })()
  }, [])

  return null
}
