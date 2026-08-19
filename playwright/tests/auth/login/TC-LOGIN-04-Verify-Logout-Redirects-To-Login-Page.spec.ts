/**
 * ========================================================================
 * TC-LOGIN-04 — Login then logout returns to login page
 * Module  : Authentication — Login
 * Type    : [+] Positive
 * Target  : https://opensource-demo.orangehrmlive.com/web/index.php/auth/login
 * File    : TC-LOGIN-04-Verify-Logout-Redirects-To-Login-Page.spec.ts
 * Path    : tests/auth/login/
 * ========================================================================
 *
 * DESCRIPTION:
 *   Verifies that login then logout returns to login page.
 *
 * API VERIFIED:
 *   Endpoint : POST /web/index.php/auth/validate
 *   Success  : 302 → Location: /dashboard/index + Set-Cookie: orangehrm=
 *   Failure  : 302 → Location: /auth/login + no cookie
 *
 * RUN THIS TEST:
 *   npx playwright test tests/auth/login/TC-LOGIN-04-Verify-Logout-Redirects-To-Login-Page.spec.ts --project=login-tests --headed
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

// GROUP 1 — POSITIVE: logging out should always return the user to login.
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

  // [+] Positive: after logging in, logging out should return the user to the login page.
  test('TC-LOGIN-04 — Login then logout returns to login page', async ({ page }) => {
    const checks: CheckResult[] = [];

    console.log(`[STEP 1] Fill username "${VALID_USERNAME}"...`);
    await loginPage.fillUsername(VALID_USERNAME);
    console.log('[STEP 2] Fill password...');
    await loginPage.fillPassword(VALID_PASSWORD);

    console.log('[STEP 3] Submit and intercept POST /auth/validate...');
    const response = await loginPage.submitAndIntercept();
    const status = response.status();
    const location = response.headers()['location'] ?? '';
    checks.push({ label: 'POST /auth/validate status', ok: status === 302, detail: String(status) });
    checks.push({ label: 'Location header', ok: location.includes('/dashboard'), detail: location });
    await loginPage.assertDashboard();

    console.log('[STEP 4] Logout via user dropdown...');
    // The Vue app routes this client-side (no full GET /auth/login navigation
    // is guaranteed to fire), so we just wait for the network to settle and
    // check the resulting URL instead of intercepting a specific request.
    await loginPage.logout();
    await page.waitForLoadState('networkidle');
    checks.push({ label: 'Logout clicked', ok: true, detail: 'clicked' });

    console.log('[STEP 5] Verify URL back at login page...');
    const onLogin = page.url().includes('/auth/login');
    checks.push({ label: 'URL contains /auth/login', ok: onLogin, detail: page.url() });

    printTcSummary('TC-LOGIN-04', 'Login then logout returns to login page', checks);
    for (const c of checks) expect(c.ok, c.label).toBe(true);
  });
});
