import { defineConfig, devices } from '@playwright/test';

const TRY_ZER0 = 0;
const TRY_TWICE = 2;
const WORKERS = 5;
const TIMEOUT_MS = 60000;

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: Boolean(process.env.CI ?? false),
  /* Retry on CI only */
  retries: process.env.CI === 'true' ? TRY_TWICE : TRY_ZER0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI === 'true' ? WORKERS : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3001',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: process.env.CI === 'true' ? 'on' : 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'yarn tsx scripts/test-server-with-msw.js',
    url: 'http://127.0.0.1:3001',
    reuseExistingServer: process.env.CI !== 'true',
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: TIMEOUT_MS,
    env: {
      NODE_ENV: 'test',
      PORT: '3001',
      API_URL: 'https://laa-civil-case-api-uat.cloud-platform.service.justice.gov.uk',
      API_PREFIX: '/latest/mock'
    }
  },
});
