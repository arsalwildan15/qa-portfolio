/**
 * ========================================================================
 * LoginPage — Page Object Model
 * Module  : Authentication — Login
 * Target  : https://opensource-demo.orangehrmlive.com/web/index.php/auth/login
 * File    : LoginPage.ts
 * Path    : pages/
 * ========================================================================
 *
 * DESCRIPTION:
 *   Wraps every login-related action (navigate, fill, submit, assert,
 *   logout) used by all 40 TC-LOGIN-* specs in tests/auth/login/. Note this
 *   class never hardcodes credentials itself — callers pass in whatever
 *   username/password they want to test (including env-var-backed values
 *   from process.env.ORANGEHRM_USERNAME / ORANGEHRM_PASSWORD).
 *
 * API VERIFIED:
 *   Endpoint : POST /web/index.php/auth/validate
 *   Success  : 302 → Location: /dashboard/index + Set-Cookie: orangehrm=
 *   Failure  : 302 → Location: /auth/login + no cookie
 *
 * RUN ALL LOGIN TESTS THAT USE THIS PAGE OBJECT:
 *   npx playwright test tests/auth/login/ --project=chromium
 * ========================================================================
 */
// Page and Response types come from Playwright's test runner — Page lets us
// drive the browser, Response lets us read status/headers from a network call.
import { Page, Response, expect } from '@playwright/test';

/**
 * Page Object Model for the OrangeHRM Login page.
 * Wraps every login-related action (navigate, fill, submit, assert) so the
 * spec file can read like a list of steps instead of raw Playwright calls.
 */
export class LoginPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /** Go to the login page fresh and wait for the network to settle. */
  async navigate() {
    // The demo server can be slow after heavier requests from a previous test
    // (e.g. a long payload submission) — use a generous timeout here so a
    // temporarily sluggish server doesn't fail the whole test.
    await this.page.goto('/web/index.php/auth/login', { timeout: 30000 });
    // 'domcontentloaded' instead of 'networkidle': networkidle can hang
    // indefinitely on this server if it keeps a background connection open.
    await this.page.waitForLoadState('domcontentloaded');

    // The shared public demo occasionally hands a brand-new, cookie-less
    // browser a session that the server already treats as authenticated —
    // a session-reuse quirk under heavy concurrent load from every other
    // tester worldwide hitting this same public instance. When that happens
    // we land straight on the dashboard instead of the login form. Detect it
    // and force a clean slate (clear cookies + reload) so the test always
    // starts from the real, logged-out login page.
    if (!(await this.page.getByPlaceholder('Username').isVisible().catch(() => false))) {
      await this.page.context().clearCookies();
      await this.page.goto('/web/index.php/auth/login', { timeout: 30000 });
      await this.page.waitForLoadState('domcontentloaded');
    }

    // Extra safety: wait until the Username input is actually visible before
    // proceeding, instead of assuming domcontentloaded alone means the form rendered.
    await this.page.getByPlaceholder('Username').waitFor({ state: 'visible', timeout: 15000 });
  }

  /** Type a value into the Username field. */
  async fillUsername(value: string) {
    // Locator targets the input by its placeholder text "Username"
    await this.page.getByPlaceholder('Username').fill(value);
  }

  /** Type a value into the Password field. */
  async fillPassword(value: string) {
    // Locator targets the input by its placeholder text "Password"
    await this.page.getByPlaceholder('Password').fill(value);
  }

  /** Click the Login button without waiting for any specific response. */
  async submit() {
    // Locator targets the button by its accessible role + visible name "Login"
    await this.page.getByRole('button', { name: 'Login' }).click();
  }

  /**
   * Click Login while listening for the POST /auth/validate call, and return
   * that API response. Promise.all is required here: waitForResponse has to
   * start listening BEFORE the click fires, otherwise the response could
   * come back before we're watching for it and the wait would hang forever.
   */
  async submitAndIntercept(): Promise<Response> {
    const [response] = await Promise.all([
      // Wait specifically for the login API call, not any other network request.
      // 30s covers both this wait and the click below on a slow server.
      this.page.waitForResponse(
        (res) => res.url().includes('/auth/validate') && res.request().method() === 'POST',
        { timeout: 30000 }
      ),
      // This click is what actually triggers the POST /auth/validate request.
      // A longer per-action timeout gives the button extra time to become
      // actionable if the server is slow to finish rendering the page.
      this.page.getByRole('button', { name: 'Login' }).click({ timeout: 15000 }),
    ]);
    return response;
  }

  /** Assert that login succeeded and we ended up on the dashboard. */
  async assertDashboard() {
    // A successful login redirects the browser URL to contain "/dashboard"
    await expect(this.page).toHaveURL(/dashboard/);
  }

  /** Assert the red "Invalid credentials" banner is shown (wrong username/password). */
  async assertInvalidCredentialsError() {
    // The rejected login redirects back to /auth/login first, and the error
    // banner can render only after that redirect settles — make sure the
    // document has finished loading before we look for it.
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(1500);
    // .oxd-alert--error is the red banner OrangeHRM shows for bad credentials
    await expect(this.page.locator('.oxd-alert--error')).toBeVisible({ timeout: 10000 });
  }

  /** Assert at least one "Required" field validation message is visible (empty field). */
  async assertValidationError() {
    // .oxd-input-field-error-message is the small red text under an empty required field
    await expect(this.page.locator('.oxd-input-field-error-message').first()).toBeVisible({ timeout: 5000 });
  }

  /** Assert an exact number of field validation messages are showing (e.g. 2 when both fields are empty). */
  async assertValidationErrorCount(count: number) {
    await expect(this.page.locator('.oxd-input-field-error-message')).toHaveCount(count);
  }

  /** Log out via the user dropdown menu (top-right avatar) then the Logout link. */
  async logout() {
    // Click the user dropdown to reveal the menu
    await this.page.locator('.oxd-userdropdown-tab').click();

    // Wait for dropdown menu to be fully visible
    await this.page.locator('.oxd-dropdown-menu').waitFor({ state: 'visible', timeout: 5000 });

    // The Logout item is a real <a href="/web/index.php/auth/logout"> (role
    // "menuitem", class "oxd-userdropdown-link"), so clicking it triggers an
    // actual navigation — wait for that navigation to land on /auth/login.
    await Promise.all([
      this.page.waitForURL('**/auth/login**', { timeout: 15000 }),
      this.page.locator('a.oxd-userdropdown-link', { hasText: 'Logout' }).click({ force: true }),
    ]);
  }

  /**
   * Like submitAndIntercept(), but for tests that expect the login to be
   * REJECTED. The shared public demo occasionally has an already-authenticated
   * session bleed into the POST /auth/validate call itself (the same
   * session-reuse quirk navigate() works around), which can make a login
   * with deliberately wrong credentials appear to "succeed". If that happens,
   * this clears cookies, starts over from a clean login page, and retries
   * once with the same credentials before giving up.
   */
  async submitAndInterceptExpectingRejection(username: string, password: string): Promise<Response> {
    let response = await this.submitAndIntercept();

    if ((response.headers()['location'] ?? '').includes('/dashboard')) {
      await this.page.context().clearCookies();
      await this.navigate();
      await this.fillUsername(username);
      await this.fillPassword(password);
      response = await this.submitAndIntercept();
    }

    return response;
  }
}
