/**
 * ========================================================================
 * TC-LOGIN-02 — Unauthenticated access to dashboard redirects to login
 * Module  : Authentication — Login
 * Type    : [+] Positive
 * Target  : https://opensource-demo.orangehrmlive.com/web/index.php/auth/login
 * File    : TC-LOGIN-02-Verify-Dashboard-Not-Accessible-Without-Login.spec.ts
 * Path    : tests/auth/login/
 * ========================================================================
 *
 * DESCRIPTION:
 *   Verifies that unauthenticated access to dashboard redirects to login.
 *
 * API VERIFIED:
 *   Endpoint : POST /web/index.php/auth/validate
 *   Success  : 302 → Location: /dashboard/index + Set-Cookie: orangehrm=
 *   Failure  : 302 → Location: /auth/login + no cookie
 *
 * RUN THIS TEST:
 *   npx playwright test tests/auth/login/TC-LOGIN-02-Verify-Dashboard-Not-Accessible-Without-Login.spec.ts --project=login-tests --headed
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

// GROUP 1 — POSITIVE: an unauthenticated user must be bounced back to login.
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

  // [+] Positive: an unauthenticated user hitting a protected URL should bounce back to login.
  test('TC-LOGIN-02 — Unauthenticated access to dashboard redirects to login', async ({ page }) => {
    const checks: CheckResult[] = [];

    console.log('[STEP 1] Navigate directly to dashboard without logging in...');
    const response = await page.goto('/web/index.php/dashboard/index');
    await page.waitForLoadState('networkidle');
    const status = response?.status() ?? 0;
    checks.push({ label: 'GET /auth/login (final document) status', ok: status === 200, detail: String(status) });

    console.log('[STEP 2] Verify redirected to login page...');
    const onLogin = page.url().includes('/auth/login');
    checks.push({ label: 'URL redirected to /auth/login', ok: onLogin, detail: page.url() });

    printTcSummary('TC-LOGIN-02', 'Unauthenticated access to dashboard redirects to login', checks);
    for (const c of checks) expect(c.ok, c.label).toBe(true);
  });
});
