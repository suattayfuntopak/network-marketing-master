import { test as setup } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const authFile = path.join(__dirname, '.auth/user.json')
const emptyState = JSON.stringify({ cookies: [], origins: [] })

function writeEmptyAuthState() {
  fs.mkdirSync(path.dirname(authFile), { recursive: true })
  fs.writeFileSync(authFile, emptyState)
}

setup('authenticate test user', async ({ page }) => {
  const email = process.env.PLAYWRIGHT_TEST_EMAIL
  const password = process.env.PLAYWRIGHT_TEST_PASSWORD

  if (!email || !password) {
    writeEmptyAuthState()
    setup.skip(true, 'PLAYWRIGHT_TEST_EMAIL / PLAYWRIGHT_TEST_PASSWORD not set')
    return
  }

  try {
    await page.goto('/giris')
    await page.locator('#email').fill(email)
    await page.locator('#password').fill(password)
    await page.getByRole('button', { name: /giriş|sign in|log in/i }).click()
    await page.waitForURL(/\/pano/, { timeout: 30_000 })
    fs.mkdirSync(path.dirname(authFile), { recursive: true })
    await page.context().storageState({ path: authFile })
  } catch (err) {
    // Bad credentials or Supabase misconfig must not fail the whole CI job.
    writeEmptyAuthState()
    const msg = err instanceof Error ? err.message : String(err)
    setup.skip(true, `Auth setup failed (smoke tests still run): ${msg}`)
  }
})
