import { test, expect } from '@playwright/test'

test.describe('saha radar activity', () => {
  test('activity member card opens pipeline detail when linked', async ({ page }) => {
    test.skip(
      !process.env.PLAYWRIGHT_TEST_EMAIL,
      'Protected route redirects to /giris when unauthenticated',
    )

    await page.goto('/saha-radar')
    await page.getByTestId('saha-radar-tab-activity').click()

    const card = page.getByTestId('saha-radar-member-card').first()
    await expect(card).toBeVisible({ timeout: 15_000 })

    const pipelineId = await card.getAttribute('data-pipeline-id')
    test.skip(!pipelineId, 'No team members with pipeline_id in test workspace')

    await card.click()
    await expect(page).toHaveURL(new RegExp(`/pipeline/${pipelineId}`))
  })
})
