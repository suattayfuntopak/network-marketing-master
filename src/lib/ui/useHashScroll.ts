'use client'

import { useEffect } from 'react'

/** /pano#journal gibi hash ile gelindiğinde hedefe yumuşak kaydır. */
export function useHashScroll(targetId: string) {
  useEffect(() => {
    function scrollIfMatch() {
      if (typeof window === 'undefined') return
      const hash = window.location.hash.replace('#', '')
      if (hash !== targetId) return
      requestAnimationFrame(() => {
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }

    scrollIfMatch()
    window.addEventListener('hashchange', scrollIfMatch)
    return () => window.removeEventListener('hashchange', scrollIfMatch)
  }, [targetId])
}
