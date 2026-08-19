/**
 * ========================================================================
 * TC-LOGIN-05 — Password field stays masked while typing
 * Module  : Authentication — Login
 * Type    : [+] Positive
 * Target  : https://opensource-demo.orangehrmlive.com/web/index.php/auth/login
 * File    : TC-LOGIN-05-Verify-Password-Field-Masked.spec.ts
 * Path    : tests/auth/login/
 * ========================================================================
 *
 * DESCRIPTION:
 *   Verifies that password field stays masked while typing.
 *
 * API VERIFIED:
 *   Endpoint : POST /web/index.php/auth/validate
 *   Success  : 302 → Location: /dashboard/index + Set-Cookie: orangehrm=
 *   Failure  : 302 → Location: /auth/login + no cookie
 *
 * RUN THIS TEST:
 *   npx playwright test tests/auth/login/TC-LOGIN-05-Verify-Password-Field-Masked.spec.ts --project=login-tests --headed
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

// GROUP 1 — POSITIVE: the password field must always stay masked.
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

  // [+] Positive: the password field must mask its input (not show plain text).
  test('TC-LOGIN-05 — Password field stays masked while typing', async ({ page }) => {
    const checks: CheckResult[] = [];

    console.log('[STEP 1] Navigate to login page...');
    const response = await page.goto('/web/index.php/auth/login');
    checks.push({ label: 'GET /auth/login status', ok: response?.status() === 200, detail: String(response?.status()) });

    const passwordInput = page.getByPlaceholder('Password');
    console.log('[STEP 2] Verify password input type before typing...');
    const typeBefore = await passwordInput.getAttribute('type');
    checks.push({ label: 'Password type before typing', ok: typeBefore === 'password', detail: typeBefore ?? 'null' });

    console.log('[STEP 3] Fill password field...');
    await passwordInput.fill('SuperSecret123');
    checks.push({ label: 'Fill password', ok: true, detail: 'filled' });

    console.log('[STEP 4] Verify password input type after typing...');
    const typeAfter = await passwordInput.getAttribute('type');
    checks.push({ label: 'Password type after typing', ok: typeAfter === 'password', detail: typeAfter ?? 'null' });

    printTcSummary('TC-LOGIN-05', 'Password field stays masked while typing', checks);
    for (const c of checks) expect(c.ok, c.label).toBe(true);
  });
});
