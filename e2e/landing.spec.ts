import { test, expect } from '@playwright/test'

test('landing page shows product name', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText(/Network Marketing Master/i).first()).toBeVisible()
})

test('login page loads', async ({ page }) => {
  await page.goto('/giris')
  await expect(page).toHaveURL(/\/giris/)
})
