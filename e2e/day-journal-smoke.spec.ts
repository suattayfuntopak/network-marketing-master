import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const authFile = path.join(__dirname, '.auth/user.json')

test.describe('Day journal smoke', () => {
  test('ilgilen hub responds without server error', async ({ page }) => {
    const response = await page.goto('/bugun/ilgilen')
    expect(response?.status()).toBeLessThan(500)
  })

  test('journal section when authenticated', async ({ page }) => {
    test.skip(
      !process.env.PLAYWRIGHT_TEST_EMAIL || !fs.existsSync(authFile),
      'Requires auth.setup with PLAYWRIGHT_TEST_EMAIL/PASSWORD',
    )

    await page.goto('/bugun/ilgilen')
    await expect(page.locator('#journal')).toBeVisible({ timeout: 20_000 })
    await expect(page.locator('#journal textarea')).toBeVisible()
  })
})
