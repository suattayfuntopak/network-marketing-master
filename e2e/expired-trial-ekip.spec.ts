import { test, expect, type Page } from '@playwright/test'

/**
 * Deneme süresi bitmiş (free, trial ended) hesap — Ekibim crash regresyonu.
 * Opsiyonel: PLAYWRIGHT_TRIAL_EXPIRED_EMAIL / PLAYWRIGHT_TRIAL_EXPIRED_PASSWORD
 */

async function expectNoRouteError(page: Page) {
  await expect(
    page.getByRole('heading', {
      name: /Bu sayfada bir hata|Something went wrong on this page/i,
    }),
  ).toHaveCount(0)
}

test.describe('expired trial ekibim', () => {
  test.beforeEach(async ({ page }) => {
    const email = process.env.PLAYWRIGHT_TRIAL_EXPIRED_EMAIL
    const password = process.env.PLAYWRIGHT_TRIAL_EXPIRED_PASSWORD
    test.skip(
      !email || !password,
      'PLAYWRIGHT_TRIAL_EXPIRED_EMAIL / PLAYWRIGHT_TRIAL_EXPIRED_PASSWORD not set',
    )

    await page.goto('/giris')
    await page.locator('#email').fill(email!)
    await page.locator('#password').fill(password!)
    await Promise.all([
      page.waitForURL(/\/pano/, { timeout: 45_000 }),
      page.getByRole('button', { name: /giriş|sign in|log in/i }).click(),
    ])
  })

  for (const path of ['/ekip', '/ekip?tab=summary', '/ekip?tab=training'] as const) {
    test(`${path} expired trial hesapta hatasız yüklenir`, async ({ page }) => {
      const res = await page.goto(path)
      expect(res?.status()).toBeLessThan(500)
      await expect(page).toHaveURL(/ekip/)
      await expectNoRouteError(page)
    })
  }
})
