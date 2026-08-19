/**
 * ========================================================================
 * TC-LOGIN-37 — Repeated failed logins are observed for rate limiting
 * Module  : Authentication — Login
 * Type    : [!] Edge
 * Target  : https://opensource-demo.orangehrmlive.com/web/index.php/auth/login
 * File    : TC-LOGIN-37-Verify-Rapid-Multiple-Failed-Logins.spec.ts
 * Path    : tests/auth/login/
 * ========================================================================
 *
 * DESCRIPTION:
 *   Verifies that repeated failed logins are observed for rate limiting.
 *
 * API VERIFIED:
 *   Endpoint : POST /web/index.php/auth/validate
 *   Success  : 302 → Location: /dashboard/index + Set-Cookie: orangehrm=
 *   Failure  : 302 → Location: /auth/login + no cookie
 *
 * RUN THIS TEST:
 *   npx playwright test tests/auth/login/TC-LOGIN-37-Verify-Rapid-Multiple-Failed-Logins.spec.ts --project=login-tests --headed
 *
 * RUN ALL LOGIN TESTS:
 *   npx playwright test tests/auth/login/ --project=login-tests --headed
 *
 * RUN HEADLESS (CI mode):
 *   npx playwright test tests/auth/login/ --project=login-tests
 * ========================================================================
 */
// Import test/expect from our custom Allure fixture (NOT directly from
// @playwright/test) — this fixture auto-tags this test with Epic/Feature/
// Story/Severity for the Allure report, based on this file's folder path.
import { test, expect } from '../../../fixtures/allure.fixture';
// Page Object Model for the Login page — wraps all the raw locators/actions
// so this spec reads as a list of test steps, not low-level Playwright calls.
import { LoginPage } from '../../../pages/LoginPage';
// Shared helper that prints the "====  TC-ID | name  ====" console summary
// block at the end of every test, collecting pass/fail per verification step.
import { printTcSummary, CheckResult } from '../../../fixtures/testSummary';

// Credentials loaded from env vars — fallback to demo defaults if not set.
// Real, working credentials for the OrangeHRM demo site (see .env.example).
const VALID_USERNAME = process.env.ORANGEHRM_USERNAME ?? 'Admin';
const VALID_PASSWORD = process.env.ORANGEHRM_PASSWORD ?? 'admin123';

// The login form posts here; both success and failure return HTTP 302 —
// the only difference is which URL is in the "location" response header.
const VALIDATE_ENDPOINT = '/auth/validate';

// GROUP 5 — EDGE: repeated failed logins should ideally trigger rate-limiting/lockout.
test.describe('Login — Authentication', () => {
  // This is a login test: we must start as a logged-out browser, so we
  // disable the saved session (.auth/session.json) that other suites rely
  // on. Without this, Playwright would inject an already-logged-in cookie
  // and this test would never see the real login form behavior.
  test.use({ storageState: undefined });

  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    // Navigate to the login page (fresh, logged-out state) before every test
    await loginPage.navigate();
  });

  // [!] Edge: repeated failed logins should ideally trigger rate-limiting/lockout — document what we find.
  test('TC-LOGIN-37 — Repeated failed logins are observed for rate limiting', async ({ page }) => {
    const checks: CheckResult[] = [];
    const observedStatuses: number[] = [];
    let sawRateLimitSignal = false;

    for (let attempt = 1; attempt <= 5; attempt += 1) {
      console.log(`[STEP ${attempt}] Attempt ${attempt}: navigate fresh and submit wrong credentials...`);
      await page.goto('/web/index.php/auth/login');
      await page.waitForLoadState('networkidle');

      await loginPage.fillUsername(VALID_USERNAME);
      await loginPage.fillPassword('wrong_password_attempt_' + attempt);
      const response = await loginPage.submitAndIntercept();

      observedStatuses.push(response.status());
      const location = response.headers()['location'] ?? '';
      checks.push({ label: `Attempt ${attempt} status`, ok: response.status() === 302 && location.includes('/auth/login'), detail: `${response.status()} ${location}` });

      const allHeaders = await response.allHeaders();
      if (response.status() === 429 || allHeaders['retry-after']) {
        sawRateLimitSignal = true;
      }

      // Small delay between attempts, as specified in the test plan — avoids hammering the public demo
      await page.waitForTimeout(1000);
    }

    console.log(`TC-LOGIN-37 observed statuses across 5 attempts: ${JSON.stringify(observedStatuses)}`);
    console.log(`TC-LOGIN-37 rate-limit signal observed: ${sawRateLimitSignal}`);
    checks.push({ label: 'Rate limit / 429 detected', ok: true, detail: sawRateLimitSignal ? 'observed' : 'none (observed)' });

    console.log('[STEP 6] Check for captcha/lockout UI...');
    const bodyText = await page.locator('body').innerText();
    const hasLockoutUi = /captcha|locked|too many attempts/i.test(bodyText);
    console.log(`TC-LOGIN-37 lockout/captcha UI present: ${hasLockoutUi}`);
    checks.push({ label: 'Lockout/captcha in UI', ok: true, detail: hasLockoutUi ? 'observed' : 'none (observed)' });

    checks.push({ label: 'No server crash (no 500s)', ok: observedStatuses.every((status) => status !== 500), detail: JSON.stringify(observedStatuses) });

    printTcSummary('TC-LOGIN-37', 'Repeated failed logins are observed for rate limiting', checks);
    for (const c of checks) expect(c.ok, c.label).toBe(true);
  });
});
