import { test, expect } from '@playwright/test'

const SELDA_CANDIDATE_ID = '00fa3484-97b1-4683-b987-638df261b6e2'
const EZGI_CANDIDATE_ID = '001a2b65-8820-4b2c-9c4a-67d1344b17c2'
const SELDA_KIRATLI_USER_ID = 'eeb42bdd-6bc0-4839-b109-d28f3e55d884'
const EZGI_SAGAR_USER_ID = 'a71184ee-5b32-455a-88aa-c6aba538cdc0'
const SELDA_FILE = 'candidate_00fa3484-97b1-4683-b987-638df261b6e2_1779647713382.jpeg'
const EZGI_FILE = 'candidate_001a2b65-8820-4b2c-9c4a-67d1344b17c2_1779982222611.jpg'

/**
 * Focus Team — Selda/Ezgi avatar + ekip aktivite 3. şahıs etiketleri smoke.
 * Kimlik yoksa veya kartlar workspace'te yoksa zarifçe atlanır.
 */

test.describe('team partner smoke', () => {
  test.beforeEach(() => {
    test.skip(
      !process.env.PLAYWRIGHT_TEST_EMAIL,
      'Protected routes — auth.setup gerektirir',
    )
  })

  test('pipeline cards use canonical Selda/Ezgi avatar URLs', async ({ page }) => {
    await page.goto('/pipeline')

    for (const [candidateId, expectedFile] of [
      [SELDA_CANDIDATE_ID, SELDA_FILE],
      [EZGI_CANDIDATE_ID, EZGI_FILE],
    ] as const) {
      const card = page.getByTestId(`pipeline-candidate-card-${candidateId}`)
      const visible = await card
        .waitFor({ state: 'visible', timeout: 12_000 })
        .then(() => true)
        .catch(() => false)
      test.skip(!visible, `Candidate ${candidateId} not in test workspace list`)

      const img = card.locator('img').first()
      await expect(img).toHaveAttribute('src', new RegExp(expectedFile))
    }
  })

  test('ekip member cards use canonical Selda/Ezgi avatar URLs', async ({ page }) => {
    await page.goto('/ekip')

    for (const [userId, expectedFile] of [
      [SELDA_KIRATLI_USER_ID, SELDA_FILE],
      [EZGI_SAGAR_USER_ID, EZGI_FILE],
    ] as const) {
      const card = page.getByTestId(`team-member-card-${userId}`)
      const visible = await card
        .waitFor({ state: 'visible', timeout: 12_000 })
        .then(() => true)
        .catch(() => false)
      test.skip(!visible, `Member ${userId} not in test workspace`)

      const img = card.locator('img').first()
      await expect(img).toHaveAttribute('src', new RegExp(expectedFile))
    }
  })

  test('member activity sheet shows 3rd-person funnel labels', async ({ page }) => {
    await page.goto('/ekip')

    const firstMember = page.getByTestId(/^team-member-card-/).first()
    const appeared = await firstMember
      .waitFor({ state: 'visible', timeout: 12_000 })
      .then(() => true)
      .catch(() => false)
    test.skip(!appeared, 'No team members in test workspace')

    await firstMember.getByRole('tab', { name: /aktivite|activity/i }).click()

    await expect(page.getByText(/Konuştu\?|did they talk/i).first()).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/Konuştum\?|did I talk/i)).toHaveCount(0)
  })
})
