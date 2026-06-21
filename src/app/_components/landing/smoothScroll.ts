/**
 * Landing içi bölüm linkleri için yumuşak (smooth) kaydırma.
 * Hedef bölüm bu sayfada varsa: varsayılan zıplamayı iptal et, sticky header'ı
 * (~80px) hesaba katarak smooth kaydır. Yoksa (ör. başka sayfadaki footer):
 * dokunma; normal link/hash navigasyonu çalışsın.
 */
import type { MouseEvent } from 'react'

export function scrollToLandingSection(
  e: MouseEvent<HTMLAnchorElement>,
  id: string,
) {
  if (typeof document === 'undefined') return
  const el = document.getElementById(id)
  if (!el) return
  e.preventDefault()
  const HEADER_OFFSET = 80
  const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET
  window.scrollTo({ top, behavior: 'smooth' })
}
