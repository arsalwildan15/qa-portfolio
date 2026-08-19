import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

// Load variables from playwright/.env (e.g. ORANGEHRM_USERNAME/PASSWORD) so
// tests can read real credentials via process.env without hardcoding them.
dotenv.config();

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 30_000,
  globalTeardown: require.resolve('./global-teardown.ts'),

  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: '../allure-report/playwright-html' }],
    ['allure-playwright', {
      detail: true,
      outputFolder: 'allure-results',
      suiteTitle: false,
    }],
  ],

  use: {
    baseURL: 'https://opensource-demo.orangehrmlive.com',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },

  projects: [
    {
      name: 'setup',
      testMatch: '**/auth/global.setup.ts',
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/session.json',
      },
      // Login tests run under the separate 'login-tests' project (they
      // always start logged out and don't need the saved session). Leave
      // tests were removed from the suite.
      testIgnore: ['**/auth/login/**', '**/leave/**'],
      dependencies: ['setup'],
    },
    {
      name: 'login-tests',
      use: {
        ...devices['Desktop Chrome'],
        storageState: undefined, // login tests always start logged out
      },
      testMatch: '**/auth/login/**/*.spec.ts',
      // No dependencies — login tests don't need global.setup.ts at all.
      // The shared public demo server is occasionally slow/flaky under load
      // from other testers worldwide — retry once before failing for real.
      retries: 1,
    },
  ],
});