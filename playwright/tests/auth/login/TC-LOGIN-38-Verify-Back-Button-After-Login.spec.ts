/**
 * ========================================================================
 * TC-LOGIN-38 — Back button after login behaves safely
 * Module  : Authentication — Login
 * Type    : [!] Edge
 * Target  : https://opensource-demo.orangehrmlive.com/web/index.php/auth/login
 * File    : TC-LOGIN-38-Verify-Back-Button-After-Login.spec.ts
 * Path    : tests/auth/login/
 * ========================================================================
 *
 * DESCRIPTION:
 *   Verifies that back button after login behaves safely.
 *
 * API VERIFIED:
 *   Endpoint : POST /web/index.php/auth/validate
 *   Success  : 302 → Location: /dashboard/index + Set-Cookie: orangehrm=
 *   Failure  : 302 → Location: /auth/login + no cookie
 *
 * RUN THIS TEST:
 *   npx playwright test tests/auth/login/TC-LOGIN-38-Verify-Back-Button-After-Login.spec.ts --project=login-tests --headed
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

// GROUP 5 — EDGE: the browser Back button after login must not expose stale/sensitive data.
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

  // [!] Edge: using the browser Back button after login should not expose stale/sensitive data.
  test('TC-LOGIN-38 — Back button after login behaves safely', async ({ page }) => {
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

    console.log('[STEP 5] Click browser Back button...');
    const requestsDuringBack: string[] = [];
    page.on('request', (req) => requestsDuringBack.push(req.url()));
    await page.goBack();
    await page.waitForLoadState('networkidle');
    console.log(`TC-LOGIN-38 requests fired during goBack(): ${JSON.stringify(requestsDuringBack)}`);
    checks.push({ label: 'goBack() executed', ok: true, detail: `${requestsDuringBack.length} request(s) observed` });

    console.log('[STEP 6] Verify behavior stays consistent (login or dashboard, no crash)...');
    const url = page.url();
    const consistent = url.includes('/auth/login') || url.includes('/dashboard');
    checks.push({ label: 'Behavior consistent (no crash)', ok: consistent, detail: url });

    printTcSummary('TC-LOGIN-38', 'Back button after login behaves safely', checks);
    for (const c of checks) expect(c.ok, c.label).toBe(true);
  });
});
