/**
 * ========================================================================
 * TC-LOGIN-30 — Double-clicking Login does not submit twice
 * Module  : Authentication — Login
 * Type    : [!] Edge
 * Target  : https://opensource-demo.orangehrmlive.com/web/index.php/auth/login
 * File    : TC-LOGIN-30-Verify-Double-Click-Login-Button.spec.ts
 * Path    : tests/auth/login/
 * ========================================================================
 *
 * DESCRIPTION:
 *   Verifies that double-clicking Login does not submit twice.
 *
 * API VERIFIED:
 *   Endpoint : POST /web/index.php/auth/validate
 *   Success  : 302 → Location: /dashboard/index + Set-Cookie: orangehrm=
 *   Failure  : 302 → Location: /auth/login + no cookie
 *
 * RUN THIS TEST:
 *   npx playwright test tests/auth/login/TC-LOGIN-30-Verify-Double-Click-Login-Button.spec.ts --project=login-tests --headed
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

// GROUP 5 — EDGE: an impatient double-click must not submit the form twice.
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

  // [!] Edge: a user double-clicking the button fast should not submit the form twice.
  test('TC-LOGIN-30 — Double-clicking Login does not submit twice', async ({ page }) => {
    const checks: CheckResult[] = [];
    let postCount = 0;
    page.on('request', (req) => {
      if (req.url().includes(VALIDATE_ENDPOINT) && req.method() === 'POST') postCount += 1;
    });

    console.log('[STEP 1] Navigate to login page...');
    const usernameVisible = await page.getByPlaceholder('Username').isVisible();
    checks.push({ label: 'Navigate to login page', ok: usernameVisible, detail: usernameVisible ? 'visible' : 'not visible' });

    console.log(`[STEP 2] Fill username "${VALID_USERNAME}"...`);
    await loginPage.fillUsername(VALID_USERNAME);
    console.log('[STEP 3] Fill password...');
    await loginPage.fillPassword(VALID_PASSWORD);

    console.log('[STEP 4] Double-click the Login button...');
    const responsePromise = page.waitForResponse(
      (res) => res.url().includes(VALIDATE_ENDPOINT) && res.request().method() === 'POST'
    );
    const loginButton = page.getByRole('button', { name: 'Login' });
    // The second click is wrapped in try/catch because the button/page may already be
    // navigating away by the time it fires, which is fine — we only care about postCount.
    await Promise.all([
      loginButton.click(),
      loginButton.click().catch(() => {}),
    ]);
    await responsePromise;
    await page.waitForLoadState('networkidle');

    console.log('[STEP 5] Verify only one POST /auth/validate reached the server...');
    checks.push({ label: 'POST /auth/validate request count', ok: postCount === 1, detail: String(postCount) });

    console.log('[STEP 6] Verify exactly one redirect to dashboard...');
    await loginPage.assertDashboard();
    checks.push({ label: 'URL after login', ok: page.url().includes('/dashboard'), detail: '/dashboard' });

    printTcSummary('TC-LOGIN-30', 'Double-clicking Login does not submit twice', checks);
    for (const c of checks) expect(c.ok, c.label).toBe(true);
  });
});
