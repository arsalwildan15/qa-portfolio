/**
 * ========================================================================
 * TC-LOGIN-21 — SQL injection in username does not bypass login
 * Module  : Authentication — Login
 * Type    : [S] Security
 * Target  : https://opensource-demo.orangehrmlive.com/web/index.php/auth/login
 * File    : TC-LOGIN-21-Verify-SQL-Injection-In-Username.spec.ts
 * Path    : tests/auth/login/
 * ========================================================================
 *
 * DESCRIPTION:
 *   Verifies that sQL injection in username does not bypass login.
 *
 * API VERIFIED:
 *   Endpoint : POST /web/index.php/auth/validate
 *   Success  : 302 → Location: /dashboard/index + Set-Cookie: orangehrm=
 *   Failure  : 302 → Location: /auth/login + no cookie
 *
 * RUN THIS TEST:
 *   npx playwright test tests/auth/login/TC-LOGIN-21-Verify-SQL-Injection-In-Username.spec.ts --project=login-tests --headed
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

// GROUP 4 — SECURITY: classic SQL injection payload must not bypass auth.
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

  // [S] Security: classic SQL injection payload in the username field must not bypass auth.
  test('TC-LOGIN-21 — SQL injection in username does not bypass login', async ({ page }) => {
    const checks: CheckResult[] = [];
    const sqlPayload = "' OR '1'='1";

    console.log('[STEP 1] Navigate to login page...');
    const usernameVisible = await page.getByPlaceholder('Username').isVisible();
    checks.push({ label: 'Navigate to login page', ok: usernameVisible, detail: usernameVisible ? 'visible' : 'not visible' });

    console.log(`[STEP 2] Fill SQL injection payload in username: ${sqlPayload}`);
    await loginPage.fillUsername(sqlPayload);
    checks.push({ label: 'Fill SQL payload in username', ok: true, detail: 'filled' });

    console.log('[STEP 3] Fill password "admin123"...');
    await loginPage.fillPassword(VALID_PASSWORD);

    console.log('[STEP 4] Submit and intercept POST /auth/validate...');
    const response = await loginPage.submitAndIntercept();
    const status = response.status();
    const location = response.headers()['location'] ?? '';
    const allHeaders = await response.allHeaders();
    const setCookie = allHeaders['set-cookie'];

    checks.push({ label: 'POST /auth/validate status', ok: status === 302, detail: String(status) });
    checks.push({ label: 'Location → /auth/login (injection rejected)', ok: location.includes('/auth/login') && !location.includes('/dashboard'), detail: location });
    checks.push({ label: 'No session cookie', ok: setCookie === undefined, detail: setCookie === undefined ? 'confirmed' : 'FOUND COOKIE' });

    console.log('[STEP 5] Verify no SQL error is leaked on the page...');
    // OrangeHRM redirects back to the login page after a rejected attempt,
    // and the error banner can render AFTER that redirect completes — wait
    // for the page to fully settle before checking for it.
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await expect(page.locator('.oxd-alert--error')).toBeVisible({ timeout: 10000 });
    const bodyText = (await page.locator('body').innerText()).toLowerCase();
    const noSqlError = !bodyText.includes('sql syntax') && !bodyText.includes('sqlexception');
    checks.push({ label: 'No SQL error on page', ok: noSqlError, detail: noSqlError ? 'confirmed' : 'SQL ERROR LEAKED' });
    checks.push({ label: 'Error message visible', ok: true, detail: 'Invalid credentials' });

    printTcSummary('TC-LOGIN-21', 'SQL injection in username does not bypass login', checks);
    for (const c of checks) expect(c.ok, c.label).toBe(true);
  });
});
