'use client'

import { useEffect } from 'react'

/** Production'da hafif PWA service worker kaydı. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return

    const buildId = process.env.NEXT_PUBLIC_BUILD_ID ?? 'dev'
    void navigator.serviceWorker
      .register(`/sw.js?v=${buildId}`, { scope: '/' })
      .catch(() => {
        // SW desteklenmiyorsa sessiz kal
      })
  }, [])

  return null
}
