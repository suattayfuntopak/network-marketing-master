import { describe, it, expect } from 'vitest'
import {
  applyHubPeriodDragResistance,
  HUB_PERIOD_DRAG_RESISTANCE,
  HUB_PERIOD_SWIPE_THRESHOLD_PX,
  resolveHubPeriodSwipe,
  resolveHubPeriodSwipeFromRaw,
} from './hubPeriodSwipe'

describe('hubPeriodSwipe', () => {
  it('direnç katsayısı ham hareketi küçültür', () => {
    expect(applyHubPeriodDragResistance(100)).toBe(100 * HUB_PERIOD_DRAG_RESISTANCE)
    expect(applyHubPeriodDragResistance(-200)).toBe(-200 * HUB_PERIOD_DRAG_RESISTANCE)
  })

  it('eşik altı hareket dönem değiştirmez', () => {
    expect(resolveHubPeriodSwipe(0)).toBeNull()
    expect(resolveHubPeriodSwipe(HUB_PERIOD_SWIPE_THRESHOLD_PX)).toBeNull()
    expect(resolveHubPeriodSwipe(-HUB_PERIOD_SWIPE_THRESHOLD_PX)).toBeNull()
    expect(resolveHubPeriodSwipe(40)).toBeNull()
    expect(resolveHubPeriodSwipe(-40)).toBeNull()
  })

  it('eşik üstü sağa kaydırma önceki döneme gider', () => {
    expect(resolveHubPeriodSwipe(HUB_PERIOD_SWIPE_THRESHOLD_PX + 1)).toBe('prev')
    expect(resolveHubPeriodSwipe(80)).toBe('prev')
  })

  it('eşik üstü sola kaydırma sonraki döneme gider', () => {
    expect(resolveHubPeriodSwipe(-HUB_PERIOD_SWIPE_THRESHOLD_PX - 1)).toBe('next')
    expect(resolveHubPeriodSwipe(-80)).toBe('next')
  })

  it('ham hareketten yön çözümü dirençle uyumlu', () => {
    const rawForPrev = Math.ceil((HUB_PERIOD_SWIPE_THRESHOLD_PX + 1) / HUB_PERIOD_DRAG_RESISTANCE)
    const rawForNext = -rawForPrev
    expect(resolveHubPeriodSwipeFromRaw(rawForPrev)).toBe('prev')
    expect(resolveHubPeriodSwipeFromRaw(rawForNext)).toBe('next')
    expect(resolveHubPeriodSwipeFromRaw(50)).toBeNull()
  })
})
