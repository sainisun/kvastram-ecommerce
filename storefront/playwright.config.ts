import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'line',
  timeout: 60000,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    headless: true,
  },
  webServer: process.env.BASE_URL
    ? undefined
    : [
        {
          command: 'node scripts/e2e-mock-api.mjs',
          url: 'http://127.0.0.1:4000/health',
          reuseExistingServer: !process.env.CI,
          timeout: 30000,
        },
        {
          command: process.env.CI
            ? 'node node_modules/next/dist/bin/next start -p 3000 -H 0.0.0.0'
            : 'node node_modules/next/dist/bin/next dev -p 3000',
          url: 'http://127.0.0.1:3000/health',
          reuseExistingServer: !process.env.CI,
          timeout: 120000,
          env: {
            ...process.env,
            INTERNAL_API_URL: process.env.INTERNAL_API_URL || 'http://127.0.0.1:4000',
            NEXT_PUBLIC_API_URL:
              process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000',
          },
        },
      ],
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'] },
    },
  ],
});
