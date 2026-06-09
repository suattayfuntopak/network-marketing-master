import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const authFile = path.join(__dirname, '.auth/user.json')

test.describe('Legacy ilgilen redirects', () => {
  test('/bugun/ilgilen redirects without server error', async ({ page }) => {
    const response = await page.goto('/bugun/ilgilen')
    expect(response?.status()).toBeLessThan(500)
    // Legacy → /hedefim (or tab target); unauthenticated users land on /giris after auth middleware.
    await expect(page).toHaveURL(/\/(hedefim|saha-ozetim|giris)/)
  })

  test('daily priorities on Saha Özetim when authenticated', async ({ page }) => {
    test.skip(
      !process.env.PLAYWRIGHT_TEST_EMAIL || !fs.existsSync(authFile),
      'Requires auth.setup with PLAYWRIGHT_TEST_EMAIL/PASSWORD',
    )

    await page.goto('/saha-ozetim?tab=daily')
    await expect(page.getByText(/öncelik|priorit/i)).toBeVisible({ timeout: 20_000 })
  })
})
