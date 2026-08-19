/**
 * ========================================================================
 * TC-LOGIN-16 — Whitespace-only password cannot log in
 * Module  : Authentication — Login
 * Type    : [-] Negative
 * Target  : https://opensource-demo.orangehrmlive.com/web/index.php/auth/login
 * File    : TC-LOGIN-16-Verify-Whitespace-Only-Password-Shows-Error.spec.ts
 * Path    : tests/auth/login/
 * ========================================================================
 *
 * DESCRIPTION:
 *   Verifies that whitespace-only password cannot log in.
 *
 * API VERIFIED:
 *   Endpoint : POST /web/index.php/auth/validate
 *   Success  : 302 → Location: /dashboard/index + Set-Cookie: orangehrm=
 *   Failure  : 302 → Location: /auth/login + no cookie
 *
 * RUN THIS TEST:
 *   npx playwright test tests/auth/login/TC-LOGIN-16-Verify-Whitespace-Only-Password-Shows-Error.spec.ts --project=login-tests --headed
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

// GROUP 2 — NEGATIVE: a password made only of spaces must never let the user in.
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

  // [-] Negative: a password made only of spaces should not be treated as valid input.
  test('TC-LOGIN-16 — Whitespace-only password cannot log in', async ({ page }) => {
    const checks: CheckResult[] = [];
    let submitted = false;
    let capturedResponse: import('@playwright/test').Response | null = null;
    page.on('request', (req) => {
      if (req.url().includes(VALIDATE_ENDPOINT)) submitted = true;
    });
    page.on('response', (res) => {
      if (res.url().includes(VALIDATE_ENDPOINT)) capturedResponse = res;
    });

    console.log('[STEP 1] Navigate to login page...');
    const usernameVisible = await page.getByPlaceholder('Username').isVisible();
    checks.push({ label: 'Navigate to login page', ok: usernameVisible, detail: usernameVisible ? 'visible' : 'not visible' });

    console.log('[STEP 2] Fill username "Admin"...');
    await loginPage.fillUsername(VALID_USERNAME);

    console.log('[STEP 3] Fill password with spaces only "   "...');
    await loginPage.fillPassword('   ');
    checks.push({ label: 'Fill password "   " (spaces only)', ok: true, detail: 'filled' });

    console.log('[STEP 4] Click Login...');
    await loginPage.submit();
    await page.waitForTimeout(1500);
    checks.push({ label: 'Click Login', ok: true, detail: 'clicked' });

    console.log('[STEP 5] Check whether POST /auth/validate was sent...');
    if (submitted && capturedResponse) {
      const res = capturedResponse as import('@playwright/test').Response;
      checks.push({ label: 'POST /auth/validate status', ok: res.status() === 302, detail: String(res.status()) });
      checks.push({ label: 'Location header', ok: (res.headers()['location'] ?? '').includes('/auth/login'), detail: res.headers()['location'] ?? '' });
      await loginPage.assertInvalidCredentialsError();
      checks.push({ label: 'Error message visible', ok: true, detail: 'Invalid credentials' });
    } else {
      await loginPage.assertValidationError();
      checks.push({ label: 'No POST /auth/validate sent', ok: true, detail: 'confirmed (FE trims whitespace)' });
      checks.push({ label: 'Required validation visible', ok: true, detail: 'Required' });
    }

    printTcSummary('TC-LOGIN-16', 'Whitespace-only password cannot log in', checks);
    for (const c of checks) expect(c.ok, c.label).toBe(true);
  });
});
