import { describe, it, expect } from 'vitest'
import {
  applyHubPeriodDragResistance,
  HUB_PERIOD_DRAG_RESISTANCE,
  HUB_PERIOD_SWIPE_THRESHOLD_PX,
  resolveHubPeriodGesture,
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

  describe('resolveHubPeriodGesture (mesafe + hız)', () => {
    it('yavaş uzun sürükleme mesafe eşiğiyle çalışır', () => {
      // 120px ham → 54px dirençli > 52 eşiği → prev (süreden bağımsız)
      expect(resolveHubPeriodGesture(120, 800)).toBe('prev')
      expect(resolveHubPeriodGesture(-120, 800)).toBe('next')
    })

    it('kısa ama hızlı fiske hız eşiğiyle çalışır', () => {
      // 40px / 50ms = 0.8 px/ms > 0.45 → mesafe yetmese de tetiklenir
      expect(resolveHubPeriodGesture(40, 50)).toBe('prev')
      expect(resolveHubPeriodGesture(-40, 50)).toBe('next')
    })

    it('yavaş ve kısa hareket dönem değiştirmez', () => {
      // 40px / 300ms = 0.13 px/ms < 0.45 ve mesafe eşiği de altında
      expect(resolveHubPeriodGesture(40, 300)).toBeNull()
      expect(resolveHubPeriodGesture(-40, 300)).toBeNull()
    })

    it('çok kısa mesafe (minimum altı) hızlı bile olsa tetiklemez', () => {
      // 20px < 24px minimum → kazara dokunuş/titreme sayılmaz
      expect(resolveHubPeriodGesture(20, 10)).toBeNull()
    })

    it('sıfır/negatif süre güvenli', () => {
      expect(resolveHubPeriodGesture(40, 0)).toBeNull()
    })
  })
})
