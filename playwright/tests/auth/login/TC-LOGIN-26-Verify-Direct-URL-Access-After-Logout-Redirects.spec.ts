/**
 * ========================================================================
 * TC-LOGIN-26 — Protected module is inaccessible after logout
 * Module  : Authentication — Login
 * Type    : [S] Security
 * Target  : https://opensource-demo.orangehrmlive.com/web/index.php/auth/login
 * File    : TC-LOGIN-26-Verify-Direct-URL-Access-After-Logout-Redirects.spec.ts
 * Path    : tests/auth/login/
 * ========================================================================
 *
 * DESCRIPTION:
 *   Verifies that protected module is inaccessible after logout.
 *
 * API VERIFIED:
 *   Endpoint : POST /web/index.php/auth/validate
 *   Success  : 302 → Location: /dashboard/index + Set-Cookie: orangehrm=
 *   Failure  : 302 → Location: /auth/login + no cookie
 *
 * RUN THIS TEST:
 *   npx playwright test tests/auth/login/TC-LOGIN-26-Verify-Direct-URL-Access-After-Logout-Redirects.spec.ts --project=login-tests --headed
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

// GROUP 4 — SECURITY: deep-linking into a protected module after logout must be blocked.
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

  // [S] Security: after logout, deep-linking into another protected module must also be blocked.
  test('TC-LOGIN-26 — Protected module is inaccessible after logout', async ({ page }) => {
    const checks: CheckResult[] = [];

    console.log('[STEP 1] Log in with valid credentials...');
    await loginPage.fillUsername(VALID_USERNAME);
    await loginPage.fillPassword(VALID_PASSWORD);
    const loginResponse = await loginPage.submitAndIntercept();
    checks.push({ label: 'Login POST status', ok: loginResponse.status() === 302, detail: String(loginResponse.status()) });
    await loginPage.assertDashboard();

    console.log('[STEP 2] Logout via user dropdown...');
    await loginPage.logout();
    await page.waitForLoadState('networkidle');
    checks.push({ label: 'Logout clicked', ok: true, detail: 'clicked' });

    console.log('[STEP 3] Attempt to open the employee list module directly...');
    await page.goto('/web/index.php/pim/viewEmployeeList');
    await page.waitForLoadState('networkidle');

    console.log('[STEP 4] Verify redirected to login, no employee data shown...');
    const onLogin = page.url().includes('/auth/login');
    checks.push({ label: 'Redirected to /auth/login', ok: onLogin, detail: page.url() });
    const bodyText = await page.locator('body').innerText();
    const noEmployeeData = !bodyText.includes('Employee List');
    checks.push({ label: 'No employee data visible', ok: noEmployeeData, detail: noEmployeeData ? 'confirmed' : 'DATA LEAKED' });

    printTcSummary('TC-LOGIN-26', 'Protected module is inaccessible after logout', checks);
    for (const c of checks) expect(c.ok, c.label).toBe(true);
  });
});
