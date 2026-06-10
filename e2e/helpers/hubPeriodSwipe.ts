import type { Locator } from '@playwright/test'

export type HubPeriodSwipeDirection = 'left' | 'right'

/**
 * Saha Özetim dönem şeridinde touch swipe simülasyonu.
 * left → sonraki dönem (offset+1), right → önceki dönem (offset-1).
 */
export async function swipeHubPeriodRibbon(
  ribbon: Locator,
  direction: HubPeriodSwipeDirection,
): Promise<void> {
  await ribbon.evaluate((el, dir) => {
    const rect = el.getBoundingClientRect()
    const y = rect.top + rect.height / 2
    const startX = dir === 'left' ? rect.left + rect.width * 0.78 : rect.left + rect.width * 0.22
    const endX = dir === 'left' ? rect.left + rect.width * 0.12 : rect.left + rect.width * 0.88

    const touch = (clientX: number): Touch =>
      new Touch({
        identifier: 1,
        target: el,
        clientX,
        clientY: y,
        pageX: clientX,
        pageY: y,
        screenX: clientX,
        screenY: y,
        radiusX: 1,
        radiusY: 1,
        rotationAngle: 0,
        force: 1,
      })

    el.dispatchEvent(
      new TouchEvent('touchstart', {
        bubbles: true,
        cancelable: true,
        touches: [touch(startX)],
        targetTouches: [touch(startX)],
        changedTouches: [touch(startX)],
      }),
    )

    const steps = 10
    for (let i = 1; i <= steps; i++) {
      const x = startX + ((endX - startX) * i) / steps
      el.dispatchEvent(
        new TouchEvent('touchmove', {
          bubbles: true,
          cancelable: true,
          touches: [touch(x)],
          targetTouches: [touch(x)],
          changedTouches: [touch(x)],
        }),
      )
    }

    el.dispatchEvent(
      new TouchEvent('touchend', {
        bubbles: true,
        cancelable: true,
        touches: [],
        targetTouches: [],
        changedTouches: [touch(endX)],
      }),
    )
  }, direction)
}
