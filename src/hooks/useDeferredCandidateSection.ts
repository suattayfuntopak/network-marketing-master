'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

/** Aday detay kartları — viewport'a girince veya manuel tetiklemede yükle. */
export function useDeferredCandidateSection(rootMargin = '240px') {
  const anchorRef = useRef<HTMLDivElement>(null)
  const [shouldLoad, setShouldLoad] = useState(false)

  const requestLoad = useCallback(() => {
    setShouldLoad(true)
  }, [])

  useEffect(() => {
    const el = anchorRef.current
    if (!el || shouldLoad) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldLoad(true)
          observer.disconnect()
        }
      },
      { rootMargin },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [shouldLoad, rootMargin])

  return { anchorRef, shouldLoad, requestLoad }
}
