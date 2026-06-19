import { test, expect } from '@playwright/test'

// Landing page redirects authenticated users to /pano — run these tests without auth.
test.use({ storageState: { cookies: [], origins: [] } })

test('landing page shows product name', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText(/Network Marketing Master/i).first()).toBeVisible()
})

test('login page loads', async ({ page }) => {
  await page.goto('/giris')
  await expect(page).toHaveURL(/\/giris/)
})

test('landing pricing shows Basic as popular with unified AI limit', async ({ page }) => {
  await page.goto('/#ucretlendirme')
  await page.locator('#ucretlendirme').scrollIntoViewIfNeeded()
  await expect(page.getByTestId('plan-basic-popular-badge')).toBeVisible()
  await expect(page.getByTestId('plan-basic-ai-limit')).toBeVisible()
  await expect(page.getByTestId('plan-basic-price')).toContainText('499')
})
