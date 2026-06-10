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
