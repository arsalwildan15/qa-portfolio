/**
 * ========================================================================
 * TC-LOGIN-23 — XSS script tag in username does not execute
 * Module  : Authentication — Login
 * Type    : [S] Security
 * Target  : https://opensource-demo.orangehrmlive.com/web/index.php/auth/login
 * File    : TC-LOGIN-23-Verify-XSS-In-Username-Is-Sanitized.spec.ts
 * Path    : tests/auth/login/
 * ========================================================================
 *
 * DESCRIPTION:
 *   Verifies that xSS script tag in username does not execute.
 *
 * API VERIFIED:
 *   Endpoint : POST /web/index.php/auth/validate
 *   Success  : 302 → Location: /dashboard/index + Set-Cookie: orangehrm=
 *   Failure  : 302 → Location: /auth/login + no cookie
 *
 * RUN THIS TEST:
 *   npx playwright test tests/auth/login/TC-LOGIN-23-Verify-XSS-In-Username-Is-Sanitized.spec.ts --project=login-tests --headed
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

// GROUP 4 — SECURITY: a <script> tag in the username must never actually execute.
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

  // [S] Security: a <script> tag in the username must never actually execute in the browser.
  test('TC-LOGIN-23 — XSS script tag in username does not execute', async ({ page }) => {
    const checks: CheckResult[] = [];
    let dialogFired = false;
    page.on('dialog', async (dialog) => {
      dialogFired = true;
      await dialog.dismiss();
    });

    console.log('[STEP 1] Navigate to login page...');
    const usernameVisible = await page.getByPlaceholder('Username').isVisible();
    checks.push({ label: 'Navigate to login page', ok: usernameVisible, detail: usernameVisible ? 'visible' : 'not visible' });

    console.log("[STEP 2] Fill XSS payload in username: <script>alert('xss')</script>");
    await loginPage.fillUsername("<script>alert('xss')</script>");
    checks.push({ label: 'Fill XSS payload in username', ok: true, detail: 'filled' });

    console.log('[STEP 3] Fill password "admin123"...');
    await loginPage.fillPassword(VALID_PASSWORD);

    console.log('[STEP 4] Submit and intercept POST /auth/validate...');
    const response = await loginPage.submitAndIntercept();
    const status = response.status();
    const location = response.headers()['location'] ?? '';
    checks.push({ label: 'POST /auth/validate status', ok: status === 302, detail: String(status) });
    checks.push({ label: 'Location header', ok: location.includes('/auth/login'), detail: location });

    console.log('[STEP 5] Wait and verify no alert dialog fired...');
    await page.waitForTimeout(1000);
    checks.push({ label: 'No alert dialog fired', ok: !dialogFired, detail: dialogFired ? 'ALERT FIRED' : 'confirmed' });

    printTcSummary('TC-LOGIN-23', 'XSS script tag in username does not execute', checks);
    for (const c of checks) expect(c.ok, c.label).toBe(true);
  });
});
