'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'

/**
 * GEÇİCİ TEŞHİS — "kendiliğinden sayfa atlaması" bug'ını yakalamak için.
 *
 * history.pushState/replaceState'i sarar ve YOL (pathname) değiştiren bir geçiş,
 * son kullanıcı girdisinden çok sonra (girdisiz) tetiklendiyse bunu "otomatik" sayar:
 *  - Her zaman console.warn (stack trace ile → tetikleyen kodu gösterir).
 *  - Süper admin'e görünür bir toast (mobilde de görülsün diye) + window.__NMM_NAV_LOG buffer.
 *
 * Kök sebep bulununca bu bileşen tamamen kaldırılacak.
 */

const AUTO_THRESHOLD_MS = 1200

type NavLogEntry = {
  at: string
  kind: 'push' | 'replace'
  from: string
  to: string
  sinceInputMs: number
  stack?: string
}

declare global {
  interface Window {
    __NMM_NAV_LOG?: NavLogEntry[]
  }
}

export function NavigationDebugger({ superAdmin = false }: { superAdmin?: boolean }) {
  useEffect(() => {
    if (typeof window === 'undefined') return

    let lastInteractionAt = Date.now()
    const mountedAt = Date.now()
    const markInteraction = () => {
      lastInteractionAt = Date.now()
    }
    const interactionEvents: (keyof WindowEventMap)[] = [
      'pointerdown',
      'keydown',
      'touchstart',
      'wheel',
      'click',
      'submit',
    ]
    interactionEvents.forEach(evt =>
      window.addEventListener(evt, markInteraction, { capture: true, passive: true }),
    )

    const origPush = window.history.pushState.bind(window.history)
    const origReplace = window.history.replaceState.bind(window.history)

    const inspect = (kind: 'push' | 'replace', urlArg: unknown) => {
      try {
        const to = typeof urlArg === 'string' ? urlArg : ''
        if (!to) return
        const fromPath = window.location.pathname
        let toPath = to
        try {
          toPath = new URL(to, window.location.origin).pathname
        } catch {
          /* göreli/bozuk URL — olduğu gibi bırak */
        }
        const sinceInputMs = Date.now() - lastInteractionAt
        const sinceMountMs = Date.now() - mountedAt
        const pathChanged = !!toPath && toPath !== fromPath
        // Girdisiz + ilk hydration penceresinin dışında + yol değişiyorsa: otomatik.
        const isAuto = pathChanged && sinceInputMs > AUTO_THRESHOLD_MS && sinceMountMs > AUTO_THRESHOLD_MS
        if (!isAuto) return

        const entry: NavLogEntry = {
          at: new Date().toISOString(),
          kind,
          from: fromPath,
          to: toPath,
          sinceInputMs,
          stack: new Error('nav-trigger').stack,
        }
        ;(window.__NMM_NAV_LOG ??= []).push(entry)
        console.warn(
          `[nav][AUTO] ${kind} ${fromPath} → ${toPath} (girdisiz ${sinceInputMs}ms)`,
          entry.stack,
        )
        if (superAdmin) {
          toast.warning(`Otomatik geçiş yakalandı: ${fromPath} → ${toPath}`, {
            duration: 9000,
            description: `Girdisiz ${Math.round(sinceInputMs / 100) / 10}sn · console: [nav][AUTO]`,
          })
        }
      } catch {
        /* teşhis aracı asla uygulamayı bozmamalı */
      }
    }

    window.history.pushState = function (
      this: History,
      ...args: Parameters<History['pushState']>
    ) {
      inspect('push', args[2])
      return origPush(...args)
    }
    window.history.replaceState = function (
      this: History,
      ...args: Parameters<History['replaceState']>
    ) {
      inspect('replace', args[2])
      return origReplace(...args)
    }

    return () => {
      window.history.pushState = origPush
      window.history.replaceState = origReplace
      interactionEvents.forEach(evt =>
        window.removeEventListener(evt, markInteraction, { capture: true }),
      )
    }
  }, [superAdmin])

  return null
}
