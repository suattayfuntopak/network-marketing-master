import { test, expect } from '@playwright/test'

/**
 * Pipeline NMM davet kaydı (?ref=WORKSPACE_INVITE_CODE&aday=CANDIDATE_UUID).
 * Ekip davet kodu değil — aday kartından üretilen kişisel kayıt linki.
 * Opsiyonel: PLAYWRIGHT_INVITE_REF + PLAYWRIGHT_INVITE_ADAY tanımlı değilse test atlanır.
 */

test.describe('davet kayıt (public)', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('/kayit geçersiz davet parametreleriyle hata veya normal form gösterir', async ({ page }) => {
    const res = await page.goto('/kayit?ref=ZZZZZZ&aday=00000000-0000-4000-8000-000000000001')
    expect(res?.status()).toBeLessThan(500)

    await expect(page.locator('#password')).toBeVisible()

    const inviteError = page.getByTestId('signup-invite-error')
    await expect(inviteError).toBeVisible({ timeout: 15_000 })
    await expect(inviteError).not.toBeEmpty()
  })

  test('kısa /d/ yolu kayıt sayfasına yönlendirir', async ({ page }) => {
    await page.goto('/d/ZZZZZZ/00000000')
    await expect(page).toHaveURL(/\/kayit/, { timeout: 15_000 })
  })

  test('/kayit davet parametresi olmadan düzenlenebilir ad ve e-posta alanları', async ({ page }) => {
    await page.goto('/kayit')

    const fullName = page.locator('#fullName')
    const email = page.locator('#email')

    await expect(fullName).toBeVisible()
    await expect(email).toBeVisible()
    await expect(fullName).toBeEditable()
    await expect(email).toBeEditable()
    await expect(page.getByTestId('signup-invite-error')).toHaveCount(0)
  })

  test('geçerli davet linkinde ad/e-posta salt okunur, yalnızca şifre düzenlenebilir', async ({
    page,
  }) => {
    const ref = process.env.PLAYWRIGHT_INVITE_REF
    const aday = process.env.PLAYWRIGHT_INVITE_ADAY
    test.skip(!ref || !aday, 'PLAYWRIGHT_INVITE_REF / PLAYWRIGHT_INVITE_ADAY tanımlı değil')

    const res = await page.goto(`/kayit?ref=${encodeURIComponent(ref!)}&aday=${encodeURIComponent(aday!)}`)
    expect(res?.status()).toBeLessThan(500)

    await expect(page.getByTestId('signup-invite-error')).toHaveCount(0, { timeout: 15_000 })

    const fullName = page.locator('#fullName')
    const email = page.locator('#email')
    const password = page.locator('#password')

    await expect(fullName).toBeVisible()
    await expect(email).toBeVisible()
    await expect(fullName).not.toBeEditable()
    await expect(email).not.toBeEditable()
    await expect(password).toBeEditable()

    await expect(fullName).not.toHaveValue('')
    await expect(email).not.toHaveValue('')

    await expect(page.getByTestId('signup-invite-hint')).toBeVisible()
  })
})
