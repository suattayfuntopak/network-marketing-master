'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'
import {
  applyHubPeriodDragResistance,
  resolveHubPeriodSwipe,
} from '@/lib/ui/hubPeriodSwipe'

type UseHubPeriodSwipeOptions = {
  onSwipePrev: () => void
  onSwipeNext: () => void
}

/** Dönem şeridinde yatay kaydırma — sayfa swipe'ını tetiklemez (passive: false). */
export function useHubPeriodSwipe(
  containerRef: RefObject<HTMLElement | null>,
  { onSwipePrev, onSwipeNext }: UseHubPeriodSwipeOptions,
) {
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragXRef = useRef(0)
  const startXRef = useRef(0)
  const activeRef = useRef(false)
  const onPrevRef = useRef(onSwipePrev)
  const onNextRef = useRef(onSwipeNext)

  useEffect(() => {
    onPrevRef.current = onSwipePrev
    onNextRef.current = onSwipeNext
  }, [onSwipePrev, onSwipeNext])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return
      activeRef.current = true
      setIsDragging(true)
      startXRef.current = e.touches[0].clientX
      dragXRef.current = 0
      setDragX(0)
    }

    const onMove = (e: TouchEvent) => {
      if (!activeRef.current || e.touches.length !== 1) return
      const dx = e.touches[0].clientX - startXRef.current
      if (Math.abs(dx) > 6) e.preventDefault()
      const resisted = applyHubPeriodDragResistance(dx)
      dragXRef.current = resisted
      setDragX(resisted)
    }

    const onEnd = () => {
      if (!activeRef.current) return
      activeRef.current = false
      setIsDragging(false)
      const dx = dragXRef.current
      dragXRef.current = 0
      setDragX(0)
      const direction = resolveHubPeriodSwipe(dx)
      if (direction === 'prev') onPrevRef.current()
      else if (direction === 'next') onNextRef.current()
    }

    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd)
    el.addEventListener('touchcancel', onEnd)

    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
      el.removeEventListener('touchcancel', onEnd)
    }
  }, [containerRef])

  return { dragX, isDragging }
}
