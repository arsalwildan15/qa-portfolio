/**
 * ========================================================================
 * TC-LOGIN-17 — 255-character username does not crash the server
 * Module  : Authentication — Login
 * Type    : [B] Boundary
 * Target  : https://opensource-demo.orangehrmlive.com/web/index.php/auth/login
 * File    : TC-LOGIN-17-Verify-Username-255-Characters-Boundary.spec.ts
 * Path    : tests/auth/login/
 * ========================================================================
 *
 * DESCRIPTION:
 *   Verifies that 255-character username does not crash the server.
 *
 * API VERIFIED:
 *   Endpoint : POST /web/index.php/auth/validate
 *   Success  : 302 → Location: /dashboard/index + Set-Cookie: orangehrm=
 *   Failure  : 302 → Location: /auth/login + no cookie
 *
 * RUN THIS TEST:
 *   npx playwright test tests/auth/login/TC-LOGIN-17-Verify-Username-255-Characters-Boundary.spec.ts --project=login-tests --headed
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

// GROUP 3 — BOUNDARY: a 255-char username is a classic max-length boundary.
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

  // [B] Boundary: a 255-character username is a common max-length boundary — must not crash the server.
  test('TC-LOGIN-17 — 255-character username does not crash the server', async ({ page }) => {
    const checks: CheckResult[] = [];
    const longUsername = 'a'.repeat(255);

    console.log('[STEP 1] Navigate to login page...');
    const usernameVisible = await page.getByPlaceholder('Username').isVisible();
    checks.push({ label: 'Navigate to login page', ok: usernameVisible, detail: usernameVisible ? 'visible' : 'not visible' });

    console.log('[STEP 2] Fill username with 255 characters...');
    await loginPage.fillUsername(longUsername);
    checks.push({ label: 'Fill username (255 chars)', ok: true, detail: 'filled' });

    console.log('[STEP 3] Fill password "admin123"...');
    await loginPage.fillPassword(VALID_PASSWORD);

    console.log('[STEP 4] Submit and measure response time...');
    const start = Date.now();
    const response = await loginPage.submitAndIntercept();
    const elapsedMs = Date.now() - start;
    const status = response.status();
    const location = response.headers()['location'] ?? '';

    checks.push({ label: 'Status is not 500', ok: status !== 500, detail: String(status) });
    checks.push({ label: 'POST /auth/validate status', ok: status === 302, detail: String(status) });
    checks.push({ label: 'Location header', ok: location.includes('/auth/login'), detail: location });
    checks.push({ label: 'Response time under 5s', ok: elapsedMs < 5000, detail: `${elapsedMs}ms` });

    console.log('[STEP 5] Verify error message visible (no crash)...');
    await loginPage.assertInvalidCredentialsError();
    checks.push({ label: 'Error message visible (no crash)', ok: true, detail: 'Invalid credentials' });

    printTcSummary('TC-LOGIN-17', '255-character username does not crash the server', checks);
    for (const c of checks) expect(c.ok, c.label).toBe(true);
  });
});
