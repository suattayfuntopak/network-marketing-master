/** Saha Özetim dönem şeridi — kaydırma eşiği ve yön çözümü (test edilebilir). */

export const HUB_PERIOD_SWIPE_THRESHOLD_PX = 52
export const HUB_PERIOD_DRAG_RESISTANCE = 0.45

export type HubPeriodSwipeDirection = 'prev' | 'next' | null

export function applyHubPeriodDragResistance(rawDx: number): number {
  return rawDx * HUB_PERIOD_DRAG_RESISTANCE
}

export function resolveHubPeriodSwipe(resistedDx: number): HubPeriodSwipeDirection {
  if (resistedDx > HUB_PERIOD_SWIPE_THRESHOLD_PX) return 'prev'
  if (resistedDx < -HUB_PERIOD_SWIPE_THRESHOLD_PX) return 'next'
  return null
}

/** Ham parmak hareketinden dönem yönü (direnç dahil). */
export function resolveHubPeriodSwipeFromRaw(rawDx: number): HubPeriodSwipeDirection {
  return resolveHubPeriodSwipe(applyHubPeriodDragResistance(rawDx))
}

/** Hızlı fiske (flick) için: kısa ama hızlı kaydırma da dönem değiştirsin. */
export const HUB_PERIOD_FLICK_MIN_DISTANCE_PX = 24
export const HUB_PERIOD_FLICK_VELOCITY_PX_PER_MS = 0.45

/**
 * Jest sonu yön çözümü: hem yavaş-uzun sürükleme (mesafe eşiği) HEM de
 * kısa-hızlı fiske (hız eşiği) dönem değiştirir.
 * @param rawDx ham yatay parmak hareketi (px) — sağa pozitif
 * @param elapsedMs jestin toplam süresi (ms)
 */
export function resolveHubPeriodGesture(
  rawDx: number,
  elapsedMs: number,
): HubPeriodSwipeDirection {
  // 1) Mesafe-tabanlı (mevcut davranış korunur).
  const byDistance = resolveHubPeriodSwipe(applyHubPeriodDragResistance(rawDx))
  if (byDistance) return byDistance

  // 2) Hız-tabanlı fiske — kısa ama hızlı kaydırma.
  if (elapsedMs <= 0 || Math.abs(rawDx) < HUB_PERIOD_FLICK_MIN_DISTANCE_PX) return null
  const velocity = rawDx / elapsedMs
  if (velocity >= HUB_PERIOD_FLICK_VELOCITY_PX_PER_MS) return 'prev' // sağa hızlı → geri
  if (velocity <= -HUB_PERIOD_FLICK_VELOCITY_PX_PER_MS) return 'next' // sola hızlı → ileri
  return null
}
