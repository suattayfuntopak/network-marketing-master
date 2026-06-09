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

  test('Saha Özetim daily tab loads when authenticated', async ({ page }) => {
    test.skip(
      !process.env.PLAYWRIGHT_TEST_EMAIL || !fs.existsSync(authFile),
      'Requires auth.setup with PLAYWRIGHT_TEST_EMAIL/PASSWORD',
    )

    const auth = JSON.parse(fs.readFileSync(authFile, 'utf8')) as { cookies?: unknown[] }
    test.skip(!auth.cookies?.length, 'Auth setup produced empty session')

    await page.goto('/saha-ozetim?tab=daily')
    await expect(page).toHaveURL(/\/saha-ozetim/)
    await expect(page.getByRole('button', { name: /Günlük|Daily/i }).first()).toBeVisible({
      timeout: 20_000,
    })
  })
})
