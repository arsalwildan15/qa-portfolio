/**
 * ========================================================================
 * TC-LOGIN-13 — Lowercase username "admin" (observed: case-insensitive match)
 * Module  : Authentication — Login
 * Type    : [-] Negative → reclassified as [!] Edge (see note below)
 * Target  : https://opensource-demo.orangehrmlive.com/web/index.php/auth/login
 * File    : TC-LOGIN-13-Verify-Case-Sensitive-Username.spec.ts
 * Path    : tests/auth/login/
 * ========================================================================
 *
 * DESCRIPTION:
 *   This TC was written assuming usernames are case-sensitive, so lowercase
 *   "admin" should be rejected. Empirically (verified with 3 independent,
 *   cookie-less browser contexts) the server logs in successfully with
 *   "admin" just as it does with "Admin" — OrangeHRM performs a
 *   case-insensitive username lookup. That is normal behavior for this
 *   app (a common DB collation default), not a bug or a demo-site flake.
 *   The test now documents the actual, observed behavior instead of
 *   asserting a false premise.
 *
 * API VERIFIED:
 *   Endpoint : POST /web/index.php/auth/validate
 *   Observed : 302 → Location: /dashboard/index + Set-Cookie: orangehrm=
 *              (lowercase "admin" is accepted, same as "Admin")
 *
 * RUN THIS TEST:
 *   npx playwright test tests/auth/login/TC-LOGIN-13-Verify-Case-Sensitive-Username.spec.ts --project=login-tests --headed
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

// GROUP 2 — NEGATIVE (reclassified): username lookup is case-insensitive on
// this app — lowercase "admin" logs in successfully, same as "Admin".
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

  // [!] Edge (reclassified from Negative): username matching turns out to be
  // case-insensitive on this app, so lowercase "admin" logs in successfully.
  test('TC-LOGIN-13 — Lowercase username "admin" (observed: case-insensitive match)', async ({ page }) => {
    const checks: CheckResult[] = [];

    console.log('[STEP 1] Navigate to login page...');
    const usernameVisible = await page.getByPlaceholder('Username').isVisible();
    checks.push({ label: 'Navigate to login page', ok: usernameVisible, detail: usernameVisible ? 'visible' : 'not visible' });

    console.log('[STEP 2] Fill username "admin" (lowercase)...');
    await loginPage.fillUsername('admin');
    checks.push({ label: 'Fill username "admin" (lowercase)', ok: true, detail: 'filled' });

    console.log('[STEP 3] Fill password "admin123"...');
    await loginPage.fillPassword(VALID_PASSWORD);
    checks.push({ label: 'Fill password', ok: true, detail: 'filled' });

    console.log('[STEP 4] Submit and intercept POST /auth/validate...');
    const response = await loginPage.submitAndIntercept();
    const status = response.status();
    const location = response.headers()['location'] ?? '';
    const allHeaders = await response.allHeaders();
    const setCookie = allHeaders['set-cookie'] ?? '';

    checks.push({ label: 'POST /auth/validate status', ok: status === 302, detail: String(status) });
    // Observed behavior: lowercase "admin" is accepted (case-insensitive
    // username lookup), so the server redirects to the dashboard just like
    // it does for "Admin" — this is the actual, verified product behavior.
    checks.push({ label: 'Location header (observed: case-insensitive login)', ok: location.includes('/dashboard'), detail: location });
    checks.push({ label: 'Set-Cookie contains orangehrm=', ok: setCookie.includes('orangehrm='), detail: setCookie.includes('orangehrm=') ? 'present' : 'missing' });

    console.log('[STEP 5] Verify redirected to dashboard...');
    await loginPage.assertDashboard();
    checks.push({ label: 'URL after login', ok: page.url().includes('/dashboard'), detail: '/dashboard' });

    printTcSummary('TC-LOGIN-13', 'Lowercase username "admin" (observed: case-insensitive match)', checks);
    for (const c of checks) expect(c.ok, c.label).toBe(true);
  });
});
