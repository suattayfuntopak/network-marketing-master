'use client'

import { useEffect, useRef } from 'react'

const DEFAULT_DELAY_MS = 10_000

/**
 * İçerik açıldıktan sonra belirli bir süre (varsayılan 10 sn) boyunca açık
 * kalırsa otomatik olarak "okundu" işaretler.
 *
 * Timer iptal koşulları:
 * - `contentId` null olur (chevron kapatılır)
 * - `contentId` değişir (başka içerik açılır)
 * - Sayfa gizlenir (`visibilitychange`)
 * - Sayfa terk edilir (`beforeunload`)
 * - Component unmount olur
 */
export function useAutoReadTracker(
  contentId: string | number | null,
  isAlreadyRead: boolean,
  onMarkAsRead: (id: string | number) => void,
  delayMs = DEFAULT_DELAY_MS,
): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const contentIdRef = useRef(contentId)
  const onMarkAsReadRef = useRef(onMarkAsRead)

  useEffect(() => {
    onMarkAsReadRef.current = onMarkAsRead
  })

  useEffect(() => {
    contentIdRef.current = contentId

    // Önceki timer'ı her zaman temizle.
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    // Timer başlatma koşulları.
    if (contentId == null || isAlreadyRead) return

    const currentId = contentId

    timerRef.current = setTimeout(() => {
      timerRef.current = null
      // Kapanmadıysa ve hâlâ aynı içerikse → okundu işaretle.
      if (contentIdRef.current === currentId) {
        onMarkAsReadRef.current(currentId)
      }
    }, delayMs)

    // Sayfa gizlendiğinde timer'ı iptal et.
    function handleVisibilityChange() {
      if (document.hidden && timerRef.current !== null) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }

    // Sayfa terk edildiğinde timer'ı iptal et.
    function handleBeforeUnload() {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [contentId, isAlreadyRead, delayMs])
}
