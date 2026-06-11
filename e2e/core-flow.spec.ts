import { test, expect } from '@playwright/test'

/**
 * Çekirdek kullanıcı akışı — giriş → pano → saha özetim → itirazlar (akademi).
 * İlke (critical-routes-smoke ile aynı): kırılgan element sorgusu YOK; HTTP durumu,
 * URL ve YALNIZCA kararlı `data-testid`'ler. Boş workspace'te bile geçer; auth
 * yoksa korumalı adımlar zarifçe atlanır. Bu spec advisory (e2e.yml) koşar —
 * deploy'u bloklamaz ama gerçek bir akışı uçtan uca korur.
 */

test.describe('public giriş akışı', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('landing → giriş sayfasına ulaşılabilir', async ({ page }) => {
    const res = await page.goto('/')
    expect(res?.status()).toBeLessThan(500)
    // Giriş ya da kayıt sayfasına doğrudan gidebilmeli (link yapısına bağlı kalmadan).
    const giris = await page.goto('/giris')
    expect(giris?.status()).toBeLessThan(500)
    await expect(page).toHaveURL(/\/giris/)
    await expect(page.getByRole('button').first()).toBeVisible()
  })
})

test.describe('kimlikli çekirdek akış', () => {
  test.skip(
    !process.env.PLAYWRIGHT_TEST_EMAIL,
    'Korumalı akış — auth.setup gerektirir',
  )

  test('pano → saha özetim şeridi → sekme geçişi → akademi itirazları', async ({ page }) => {
    // 1) Pano açılır.
    const pano = await page.goto('/pano')
    expect(pano?.status()).toBeLessThan(500)
    await expect(page).toHaveURL(/\/pano/)

    // 2) Saha Özetim — dönem şeridi görünür (client-state navigator).
    const saha = await page.goto('/saha-ozetim?tab=daily')
    expect(saha?.status()).toBeLessThan(500)
    const ribbon = page.getByTestId('hub-period-navigator')
    await expect(ribbon).toBeVisible()

    // 3) Sekme geçişi client-state ile URL'i günceller (RSC turu yok).
    await page.getByTestId('hub-summary-tab-monthly').click()
    await expect(page).toHaveURL(/tab=monthly/)
    await page.getByTestId('hub-summary-tab-yearly').click()
    await expect(page).toHaveURL(/tab=yearly/)

    // 4) Akademi itiraz bankası açılır (itirazlar → /egitim?tab=objections).
    const egitim = await page.goto('/egitim?tab=objections')
    expect(egitim?.status()).toBeLessThan(500)
    await expect(page).toHaveURL(/tab=objections/)
  })
})
