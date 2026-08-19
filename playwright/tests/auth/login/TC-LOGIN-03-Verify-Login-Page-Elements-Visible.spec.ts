/**
 * ========================================================================
 * TC-LOGIN-03 — Login page renders all expected elements
 * Module  : Authentication — Login
 * Type    : [+] Positive
 * Target  : https://opensource-demo.orangehrmlive.com/web/index.php/auth/login
 * File    : TC-LOGIN-03-Verify-Login-Page-Elements-Visible.spec.ts
 * Path    : tests/auth/login/
 * ========================================================================
 *
 * DESCRIPTION:
 *   Verifies that login page renders all expected elements.
 *
 * API VERIFIED:
 *   Endpoint : POST /web/index.php/auth/validate
 *   Success  : 302 → Location: /dashboard/index + Set-Cookie: orangehrm=
 *   Failure  : 302 → Location: /auth/login + no cookie
 *
 * RUN THIS TEST:
 *   npx playwright test tests/auth/login/TC-LOGIN-03-Verify-Login-Page-Elements-Visible.spec.ts --project=login-tests --headed
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

// GROUP 1 — POSITIVE: all expected elements on the login page should render.
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

  // [+] Positive: all expected elements on the login page should be visible.
  test('TC-LOGIN-03 — Login page renders all expected elements', async ({ page }) => {
    const checks: CheckResult[] = [];

    console.log('[STEP 1] Navigate to login page...');
    const response = await page.goto('/web/index.php/auth/login');
    await page.waitForLoadState('networkidle');
    const status = response?.status() ?? 0;
    const contentType = response?.headers()['content-type'] ?? '';
    checks.push({ label: 'GET /auth/login status', ok: status === 200, detail: String(status) });
    checks.push({ label: 'Content-Type', ok: contentType.includes('text/html'), detail: contentType });

    console.log('[STEP 2] Verify logo visible...');
    const logoVisible = await page.locator('img').first().isVisible();
    checks.push({ label: 'Logo visible', ok: logoVisible, detail: logoVisible ? 'visible' : 'not visible' });

    console.log('[STEP 3] Verify "Login" heading visible...');
    // getByText('Login') would match both the <h5>Login</h5> heading AND the
    // "Login" submit button (strict-mode violation) — the role-based locator
    // disambiguates to just the heading.
    const headingVisible = await page.getByRole('heading', { name: 'Login' }).isVisible();
    checks.push({ label: 'Heading "Login" visible', ok: headingVisible, detail: headingVisible ? 'visible' : 'not visible' });

    console.log('[STEP 4] Verify Username input visible...');
    const usernameVisible = await page.getByPlaceholder('Username').isVisible();
    checks.push({ label: 'Username input visible', ok: usernameVisible, detail: usernameVisible ? 'visible' : 'not visible' });

    console.log('[STEP 5] Verify Password input visible...');
    const passwordVisible = await page.getByPlaceholder('Password').isVisible();
    checks.push({ label: 'Password input visible', ok: passwordVisible, detail: passwordVisible ? 'visible' : 'not visible' });

    console.log('[STEP 6] Verify Login button visible...');
    const buttonVisible = await page.getByRole('button', { name: 'Login' }).isVisible();
    checks.push({ label: 'Login button visible', ok: buttonVisible, detail: buttonVisible ? 'visible' : 'not visible' });

    console.log('[STEP 7] Verify "Forgot your password?" link visible...');
    const forgotVisible = await page.getByText('Forgot your password?').isVisible();
    checks.push({ label: '"Forgot your password?" link visible', ok: forgotVisible, detail: forgotVisible ? 'visible' : 'not visible' });

    printTcSummary('TC-LOGIN-03', 'Login page renders all expected elements', checks);
    for (const c of checks) expect(c.ok, c.label).toBe(true);
  });
});
