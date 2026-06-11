import { test, expect } from '@playwright/test'

/**
 * Kritik rota smoke kapsamı — dar ama dayanıklı.
 * İlke: kırılgan element sorguları yerine HTTP durumu + URL kontrolü
 * (day-journal-smoke'taki ARIA role regresyonundan çıkarılan ders).
 */

// Public dönüşüm sayfaları — auth gerekmez, asla yönlendirilmez.
test.describe('public critical routes', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  for (const path of ['/giris', '/kayit'] as const) {
    test(`${path} sunucu hatası vermeden yüklenir`, async ({ page }) => {
      const res = await page.goto(path)
      expect(res?.status()).toBeLessThan(500)
      await expect(page).toHaveURL(new RegExp(path.replace('/', '\\/')))
    })
  }
})

// Auth korumalı ana sayfalar — kimlik yoksa /giris'e yönlenir, o yüzden skip.
const AUTH_ROUTES = ['/pano', '/hedefim', '/ekip', '/istatistikler', '/saha-ozetim', '/crown', '/canli-egitim', '/egitim'] as const

test.describe('authenticated core routes', () => {
  for (const path of AUTH_ROUTES) {
    test(`${path} kimlikli kullanıcıda hatasız yüklenir`, async ({ page }) => {
      test.skip(
        !process.env.PLAYWRIGHT_TEST_EMAIL,
        'Korumalı rota — auth.setup gerektirir',
      )
      const res = await page.goto(path)
      expect(res?.status()).toBeLessThan(500)
      await expect(page).toHaveURL(new RegExp(path.replace('/', '\\/')))
    })
  }
})
