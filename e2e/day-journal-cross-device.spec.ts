import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const authFile = path.join(__dirname, '.auth/user.json')

test.describe('Day journal cross-device sync', () => {
  test.beforeEach(() => {
    test.skip(
      !process.env.PLAYWRIGHT_TEST_EMAIL || !fs.existsSync(authFile),
      'Requires auth.setup with PLAYWRIGHT_TEST_EMAIL/PASSWORD',
    )
  })

  test('text written in one context appears in another', async ({ browser }) => {
    const ctxA = await browser.newContext({ storageState: authFile })
    const ctxB = await browser.newContext({ storageState: authFile })
    const pageA = await ctxA.newPage()
    const pageB = await ctxB.newPage()

    const unique = `sync-test-${Date.now()}`

    await pageA.goto('/bugun/ilgilen')
    await expect(pageA.locator('#journal textarea')).toBeVisible({ timeout: 20_000 })
    await pageA.locator('#journal textarea').fill(unique)
    await pageA.waitForTimeout(900)

    await pageB.goto('/bugun/ilgilen')
    await expect(pageB.locator('#journal textarea')).toHaveValue(unique, { timeout: 20_000 })

    await ctxA.close()
    await ctxB.close()
  })
})
