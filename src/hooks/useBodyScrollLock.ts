'use client'

import { useEffect } from 'react'
import { lockBodyScroll, unlockBodyScroll } from '@/lib/ui/bodyScrollLock'

/** Locks document scroll while `locked` is true (nested overlays use ref counting). */
export function useBodyScrollLock(locked = true) {
  useEffect(() => {
    if (!locked) return
    lockBodyScroll()
    return () => unlockBodyScroll()
  }, [locked])
}
