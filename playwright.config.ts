import { defineConfig, devices } from '@playwright/test'

const authFile = 'e2e/.auth/user.json'

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: authFile },
      dependencies: ['setup'],
      testIgnore: /auth\.setup\.ts/,
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'], storageState: authFile },
      dependencies: ['setup'],
      testIgnore: /auth\.setup\.ts/,
    },
  ],
  webServer: {
    command: process.env.CI ? 'npm run start' : 'npm run dev',
    url: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
