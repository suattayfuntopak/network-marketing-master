import { test, expect, devices } from '@playwright/test'

/** Viewport-only — full `devices[...]` spread sets defaultBrowserType and breaks inside describe. */
const MOBILE_VIEWPORT = {
  viewport: devices['iPhone 13'].viewport,
  isMobile: true,
  hasTouch: true,
}

const DASHBOARD_ROUTES = ['/pano', '/saha-ozetim', '/egitim'] as const

test.describe('dashboard routes (mobile viewport)', () => {
  test.use(MOBILE_VIEWPORT)

  for (const path of DASHBOARD_ROUTES) {
    test(`${path} responds without server error`, async ({ page }) => {
      const response = await page.goto(path)
      expect(response?.status()).toBeLessThan(500)
    })
  }

  test('/egitim supports objections tab query', async ({ page }) => {
    test.skip(!process.env.PLAYWRIGHT_TEST_EMAIL, 'Protected route redirects to /giris when unauthenticated')
    const response = await page.goto('/egitim?tab=objections')
    expect(response?.status()).toBeLessThan(500)
    await expect(page).toHaveURL(/\/egitim/)
  })

  test('/saha-ozetim period ribbon swipe advances offset', async ({ page }) => {
    test.skip(!process.env.PLAYWRIGHT_TEST_EMAIL, 'Protected route redirects to /giris when unauthenticated')
    await page.goto('/saha-ozetim?tab=daily')
    const ribbon = page.getByTestId('hub-period-navigator')
    await expect(ribbon).toBeVisible()

    await ribbon.evaluate(el => {
      const rect = el.getBoundingClientRect()
      const y = rect.top + rect.height / 2
      const startX = rect.left + rect.width * 0.78
      const endX = rect.left + rect.width * 0.12

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
    })

    await expect(page).toHaveURL(/offset=1/)
  })

  test('/egitim tab bar stays single-line on mobile', async ({ page }) => {
    test.skip(!process.env.PLAYWRIGHT_TEST_EMAIL, 'Protected route redirects to /giris when unauthenticated')
    await page.goto('/egitim')
    const tablist = page.getByRole('tablist').first()
    await expect(tablist).toBeVisible()
    const box = await tablist.boundingBox()
    expect(box).not.toBeNull()
    if (box) {
      expect(box.height).toBeLessThan(56)
    }
    const tabs = tablist.getByRole('tab')
    await expect(tabs).toHaveCount(3)
    for (let i = 0; i < 3; i++) {
      await expect(tabs.nth(i)).toBeVisible()
    }
  })

  test('/itirazlar redirects into akademi objections tab', async ({ page }) => {
    test.skip(!process.env.PLAYWRIGHT_TEST_EMAIL, 'Protected route redirects to /giris when unauthenticated')
    await page.goto('/itirazlar')
    await expect(page).toHaveURL(/\/egitim\?.*tab=objections/)
  })

  test('/itirazlar preserves id query on redirect', async ({ page }) => {
    test.skip(!process.env.PLAYWRIGHT_TEST_EMAIL, 'Protected route redirects to /giris when unauthenticated')
    await page.goto('/itirazlar?id=2')
    await expect(page).toHaveURL(/\/egitim\?.*tab=objections/)
    await expect(page).toHaveURL(/[?&]id=2/)
  })
})

test.describe('mobile shell (unauthenticated)', () => {
  test.use(MOBILE_VIEWPORT)

  test('login page is usable on narrow screens', async ({ page }) => {
    await page.goto('/giris')
    await expect(page.getByRole('button').first()).toBeVisible()
    const box = page.locator('main, form, [class*="rounded"]').first()
    await expect(box).toBeVisible()
  })
})
