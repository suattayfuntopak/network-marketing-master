import { test, expect, devices } from '@playwright/test'
import { swipeHubPeriodRibbon } from './helpers/hubPeriodSwipe'

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

  test('/saha-ozetim daily ribbon swipe left advances offset', async ({ page }) => {
    test.skip(!process.env.PLAYWRIGHT_TEST_EMAIL, 'Protected route redirects to /giris when unauthenticated')
    await page.goto('/saha-ozetim?tab=daily')
    const ribbon = page.getByTestId('hub-period-navigator')
    await expect(ribbon).toBeVisible()
    await swipeHubPeriodRibbon(ribbon, 'left')
    await expect(page).toHaveURL(/offset=1/)
  })

  test('/saha-ozetim weekly ribbon swipe right goes to previous week', async ({ page }) => {
    test.skip(!process.env.PLAYWRIGHT_TEST_EMAIL, 'Protected route redirects to /giris when unauthenticated')
    await page.goto('/saha-ozetim?tab=weekly')
    const ribbon = page.getByTestId('hub-period-navigator')
    await expect(ribbon).toBeVisible()
    await swipeHubPeriodRibbon(ribbon, 'right')
    await expect(page).toHaveURL(/offset=-1/)
  })

  test('/saha-ozetim tab bar switches period via click', async ({ page }) => {
    test.skip(!process.env.PLAYWRIGHT_TEST_EMAIL, 'Protected route redirects to /giris when unauthenticated')
    await page.goto('/saha-ozetim?tab=daily')
    await page.getByTestId('hub-summary-tab-monthly').click()
    await expect(page).toHaveURL(/tab=monthly/)
    await page.getByTestId('hub-summary-tab-yearly').click()
    await expect(page).toHaveURL(/tab=yearly/)
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
