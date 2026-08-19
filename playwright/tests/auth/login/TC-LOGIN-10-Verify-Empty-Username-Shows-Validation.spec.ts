/**
 * ========================================================================
 * TC-LOGIN-10 — Empty username shows Required validation
 * Module  : Authentication — Login
 * Type    : [-] Negative
 * Target  : https://opensource-demo.orangehrmlive.com/web/index.php/auth/login
 * File    : TC-LOGIN-10-Verify-Empty-Username-Shows-Validation.spec.ts
 * Path    : tests/auth/login/
 * ========================================================================
 *
 * DESCRIPTION:
 *   Verifies that empty username shows Required validation.
 *
 * API VERIFIED:
 *   Endpoint : POST /web/index.php/auth/validate
 *   Success  : 302 → Location: /dashboard/index + Set-Cookie: orangehrm=
 *   Failure  : 302 → Location: /auth/login + no cookie
 *
 * RUN THIS TEST:
 *   npx playwright test tests/auth/login/TC-LOGIN-10-Verify-Empty-Username-Shows-Validation.spec.ts --project=login-tests --headed
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

// GROUP 2 — NEGATIVE: an empty username must be blocked by front-end validation.
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

  // [-] Negative: submitting with an empty username should be blocked client-side.
  test('TC-LOGIN-10 — Empty username shows Required validation', async ({ page }) => {
    const checks: CheckResult[] = [];
    let submitted = false;
    page.on('request', (req) => {
      if (req.url().includes(VALIDATE_ENDPOINT)) submitted = true;
    });

    console.log('[STEP 1] Navigate to login page...');
    const usernameVisible = await page.getByPlaceholder('Username').isVisible();
    checks.push({ label: 'Navigate to login page', ok: usernameVisible, detail: usernameVisible ? 'visible' : 'not visible' });

    console.log('[STEP 2] Leave username empty...');
    checks.push({ label: 'Username left empty', ok: true, detail: 'empty' });

    console.log(`[STEP 3] Fill password "admin123"...`);
    await loginPage.fillPassword(VALID_PASSWORD);

    console.log('[STEP 4] Click Login...');
    await loginPage.submit();
    await page.waitForTimeout(1000);
    checks.push({ label: 'Click Login', ok: true, detail: 'clicked' });

    console.log('[STEP 5] Verify no POST /auth/validate was sent...');
    checks.push({ label: 'No POST /auth/validate sent', ok: !submitted, detail: submitted ? 'REQUEST WAS SENT' : 'confirmed (FE validation)' });

    console.log('[STEP 6] Verify "Required" validation visible...');
    await loginPage.assertValidationError();
    checks.push({ label: 'Required validation visible', ok: true, detail: 'Required' });

    console.log('[STEP 7] Verify URL stays at /auth/login...');
    const stillOnLogin = page.url().includes('/auth/login');
    checks.push({ label: 'URL stays at /auth/login', ok: stillOnLogin, detail: page.url() });

    printTcSummary('TC-LOGIN-10', 'Empty username shows Required validation', checks);
    for (const c of checks) expect(c.ok, c.label).toBe(true);
  });
});
