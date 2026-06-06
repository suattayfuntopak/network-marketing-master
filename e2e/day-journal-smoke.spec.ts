import { test, expect } from '@playwright/test'

test.describe('Day journal smoke', () => {
  test('ilgilen hub responds without server error', async ({ page }) => {
    const response = await page.goto('/bugun/ilgilen')
    expect(response?.status()).toBeLessThan(500)
  })

  test('journal section when authenticated', async ({ page }) => {
    test.skip(
      !process.env.PLAYWRIGHT_STORAGE_STATE,
      'Set PLAYWRIGHT_STORAGE_STATE to a saved auth storage path',
    )

    await page.goto('/bugun/ilgilen')
    await expect(page.locator('#journal')).toBeVisible({ timeout: 20_000 })
    await expect(page.locator('#journal textarea')).toBeVisible()
  })
})
