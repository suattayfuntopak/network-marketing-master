'use client'

import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useTranslation } from '@/providers/LanguageProvider'

const BOOT_BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID ?? ''

/** Yeni deploy sonrası eski JS bundle kullanımını tespit edip yenileme önerir. */
export function AppVersionGuard() {
  const { t } = useTranslation()
  const prompted = useRef(false)

  useEffect(() => {
    if (!BOOT_BUILD_ID || typeof window === 'undefined') return

    const check = async () => {
      if (prompted.current) return
      try {
        const res = await fetch('/api/app-version', { cache: 'no-store' })
        if (!res.ok) return
        const { buildId } = (await res.json()) as { buildId?: string }
        if (!buildId || buildId === BOOT_BUILD_ID) return
        prompted.current = true
        toast(t('common.appUpdateTitle'), {
          duration: Infinity,
          action: {
            label: t('common.appUpdateReload'),
            onClick: () => window.location.reload(),
          },
        })
      } catch {
        // Ağ yoksa sessiz kal
      }
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') void check()
    }

    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [t])

  return null
}
