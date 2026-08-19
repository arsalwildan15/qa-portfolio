import { Page, expect } from '@playwright/test';

export class LeaveApplyPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigate() {
    await this.page.goto('/web/index.php/leave/applyLeave');
    await this.page.waitForSelector('.oxd-select-text, .orangehrm-main-title + hr + p', { timeout: 15_000 });
  }

  async selectLeaveType(name: string) {
    await this.page.locator('.oxd-select-text').first().click();
    await this.page.getByRole('option', { name }).click();
  }

  /** from/to must be in the widget's yyyy-dd-mm format */
  async fillDateRange(from: string, to: string) {
    const dateInputs = this.page.locator('input[placeholder="yyyy-dd-mm"]');
    for (const [index, value] of [from, to].entries()) {
      const input = dateInputs.nth(index);
      // fill() leaves stale text in this masked widget — clear explicitly first.
      await input.click();
      await input.press('Control+A');
      await input.press('Delete');
      await input.pressSequentially(value);
    }
  }

  async fillComment(comment: string) {
    await this.page.locator('textarea').fill(comment);
  }

  async submit() {
    await this.page.getByRole('button', { name: 'Apply' }).click();
  }

  async assertSuccess() {
    // Multi-day requests skip the toast and show a "Records Found" summary instead.
    await expect(
      this.page.getByText('Successfully Saved').or(this.page.getByText(/Records? Found/))
    ).toBeVisible({ timeout: 8000 });
  }

  async assertValidationError(message: string = 'Required') {
    await expect(this.page.getByText(message)).toBeVisible({ timeout: 5000 });
  }
}
