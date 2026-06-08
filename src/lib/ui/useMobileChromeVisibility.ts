'use client'

import { useEffect, useRef, useState } from 'react'

const MOBILE_MQ = '(max-width: 767px)'
const SHOW_DELAY_MS = 400
const TOP_THRESHOLD_PX = 20

/** Scroll hedefi modal / küçük liste mi — chrome gizlemeyi atla */
function shouldIgnoreScrollTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  if (target.closest('[data-chrome-scroll-ignore]')) return true
  if (target.closest('[role="dialog"], [role="alertdialog"]')) return true
  const el = target as HTMLElement
  const overflowY = getComputedStyle(el).overflowY
  const scrollable = overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay'
  if (!scrollable) return false
  // Küçük iç listeler (dropdown, not alanı) — sayfa kaydırması değil
  if (el.scrollHeight - el.clientHeight < 80 && !el.hasAttribute('data-main-scroll')) return true
  return false
}

function scrollOffsetForTarget(target: EventTarget | null): number {
  if (target === document || target === document.documentElement || target === document.body) {
    return window.scrollY || document.documentElement.scrollTop || 0
  }
  if (target instanceof Element && typeof target.scrollTop === 'number') {
    return target.scrollTop
  }
  return window.scrollY || document.documentElement.scrollTop || 0
}

/**
 * Mobilde scroll sırasında header + bottom nav gizlenir; durunca kısa gecikmeyle geri gelir.
 * Nested scroll container'lar (pano main vb.) için document capture dinleyicisi kullanır.
 */
export function useMobileChromeVisibility(pathname: string) {
  const [visible, setVisible] = useState(true)
  const visibleRef = useRef(true)
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touchActive = useRef(false)

  function setChromeVisible(next: boolean) {
    if (visibleRef.current === next) return
    visibleRef.current = next
    setVisible(next)
  }

  function scheduleShowAfterIdle() {
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current)
    scrollTimeout.current = setTimeout(() => {
      setChromeVisible(true)
    }, SHOW_DELAY_MS)
  }

  useEffect(() => {
    setChromeVisible(true)
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current)
      scrollTimeout.current = null
    }
  }, [pathname])

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ)

    function onScroll(e: Event) {
      if (!mq.matches) return
      if (shouldIgnoreScrollTarget(e.target)) return

      const offset = scrollOffsetForTarget(e.target)
      if (offset < TOP_THRESHOLD_PX) {
        setChromeVisible(true)
        if (scrollTimeout.current) {
          clearTimeout(scrollTimeout.current)
          scrollTimeout.current = null
        }
        return
      }

      setChromeVisible(false)
      scheduleShowAfterIdle()
    }

    /** iOS: momentum scroll başlamadan önce tepki ver */
    function onTouchStart() {
      if (!mq.matches) return
      touchActive.current = true
    }

    function onTouchMove(e: TouchEvent) {
      if (!mq.matches || !touchActive.current) return
      if (shouldIgnoreScrollTarget(e.target)) return

      const offset = scrollOffsetForTarget(e.target)
      if (offset < TOP_THRESHOLD_PX) {
        setChromeVisible(true)
        return
      }
      setChromeVisible(false)
      scheduleShowAfterIdle()
    }

    function onTouchEnd() {
      touchActive.current = false
      if (!mq.matches) return
      scheduleShowAfterIdle()
    }

    function onMqChange() {
      if (!mq.matches) {
        setChromeVisible(true)
        if (scrollTimeout.current) {
          clearTimeout(scrollTimeout.current)
          scrollTimeout.current = null
        }
      }
    }

    document.addEventListener('scroll', onScroll, { passive: true, capture: true })
    document.addEventListener('touchstart', onTouchStart, { passive: true, capture: true })
    document.addEventListener('touchmove', onTouchMove, { passive: true, capture: true })
    document.addEventListener('touchend', onTouchEnd, { passive: true, capture: true })
    document.addEventListener('touchcancel', onTouchEnd, { passive: true, capture: true })
    mq.addEventListener('change', onMqChange)

    return () => {
      document.removeEventListener('scroll', onScroll, { capture: true })
      document.removeEventListener('touchstart', onTouchStart, { capture: true })
      document.removeEventListener('touchmove', onTouchMove, { capture: true })
      document.removeEventListener('touchend', onTouchEnd, { capture: true })
      document.removeEventListener('touchcancel', onTouchEnd, { capture: true })
      mq.removeEventListener('change', onMqChange)
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return visible
}
