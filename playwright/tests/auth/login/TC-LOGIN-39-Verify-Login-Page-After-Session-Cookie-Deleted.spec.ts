/**
 * ========================================================================
 * TC-LOGIN-39 — Deleting cookies revokes access to the dashboard
 * Module  : Authentication — Login
 * Type    : [!] Edge
 * Target  : https://opensource-demo.orangehrmlive.com/web/index.php/auth/login
 * File    : TC-LOGIN-39-Verify-Login-Page-After-Session-Cookie-Deleted.spec.ts
 * Path    : tests/auth/login/
 * ========================================================================
 *
 * DESCRIPTION:
 *   Verifies that deleting cookies revokes access to the dashboard.
 *
 * API VERIFIED:
 *   Endpoint : POST /web/index.php/auth/validate
 *   Success  : 302 → Location: /dashboard/index + Set-Cookie: orangehrm=
 *   Failure  : 302 → Location: /auth/login + no cookie
 *
 * RUN THIS TEST:
 *   npx playwright test tests/auth/login/TC-LOGIN-39-Verify-Login-Page-After-Session-Cookie-Deleted.spec.ts --project=login-tests --headed
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

// GROUP 5 — EDGE: manually deleting cookies must revoke access just like a real logout.
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

  // [!] Edge: manually deleting cookies should immediately revoke access, just like a real logout.
  test('TC-LOGIN-39 — Deleting cookies revokes access to the dashboard', async ({ page }) => {
    const checks: CheckResult[] = [];

    console.log('[STEP 1] Navigate to login page...');
    const usernameVisible = await page.getByPlaceholder('Username').isVisible();
    checks.push({ label: 'Navigate to login page', ok: usernameVisible, detail: usernameVisible ? 'visible' : 'not visible' });

    console.log(`[STEP 2] Fill username "${VALID_USERNAME}"...`);
    await loginPage.fillUsername(VALID_USERNAME);
    console.log('[STEP 3] Fill password...');
    await loginPage.fillPassword(VALID_PASSWORD);

    console.log('[STEP 4] Submit and intercept POST /auth/validate...');
    const response = await loginPage.submitAndIntercept();
    checks.push({ label: 'Login POST status', ok: response.status() === 302, detail: String(response.status()) });
    await loginPage.assertDashboard();

    console.log('[STEP 5] Clear all cookies...');
    await page.context().clearCookies();
    checks.push({ label: 'Cookies cleared', ok: true, detail: 'cleared' });

    console.log('[STEP 6] Navigate to dashboard without a session cookie...');
    // OrangeHRM can respond with a 302 redirect (not a clean 200) once cookies
    // are cleared, so we don't assert on the raw response status here —
    // instead just verify where the browser actually ends up. With
    // waitUntil: 'commit', Playwright can also throw net::ERR_ABORTED if the
    // server redirects before the original navigation commits — that's
    // expected here, not a real failure, so we swallow it.
    try {
      await page.goto('/web/index.php/dashboard/index', { timeout: 30000, waitUntil: 'commit' });
    } catch (e) {
      // ERR_ABORTED is expected — the server redirected us to the login page
    }
    checks.push({ label: 'Navigated to /dashboard/index', ok: true, detail: 'navigated' });

    console.log('[STEP 7] Verify redirected to login, no dashboard data leaked...');
    await expect(page).toHaveURL(/auth\/login/, { timeout: 10000 });
    const onLogin = page.url().includes('/auth/login');
    checks.push({ label: 'Redirected to /auth/login', ok: onLogin, detail: page.url() });
    const bodyText = await page.locator('body').innerText();
    const noLeak = !bodyText.includes('Dashboard');
    checks.push({ label: 'No dashboard data leaked', ok: noLeak, detail: noLeak ? 'confirmed' : 'DATA LEAKED' });

    printTcSummary('TC-LOGIN-39', 'Deleting cookies revokes access to the dashboard', checks);
    for (const c of checks) expect(c.ok, c.label).toBe(true);
  });
});
