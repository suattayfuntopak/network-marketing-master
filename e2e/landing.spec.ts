import { test, expect } from '@playwright/test'

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
  await expect(page.getByText(/En Çok Satan|Popular/i).first()).toBeVisible()
  await expect(
    page.getByText(/Günlük 20 Yapay Zeka Mesajı|Daily 20 AI Messages/i).first(),
  ).toBeVisible()
  await expect(page.getByText('₺399').first()).toBeVisible()
})
