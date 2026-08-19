import { test as setup, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const SESSION_FILE = path.join(__dirname, '../../.auth/session.json');

setup('authenticate and save session', async ({ page }) => {
  // Ensure .auth directory exists
  fs.mkdirSync(path.dirname(SESSION_FILE), { recursive: true });

  await page.goto('/web/index.php/auth/login');
  await page.waitForLoadState('domcontentloaded');

  await page.getByPlaceholder('Username').fill('Admin');
  await page.getByPlaceholder('Password').fill('admin123');
  await page.getByRole('button', { name: 'Login' }).click();

  // Wait until dashboard is loaded
  await expect(page).toHaveURL(/dashboard/);

  // Save storage state (cookies + localStorage)
  await page.context().storageState({ path: SESSION_FILE });

  console.log('Session saved to', SESSION_FILE);
});
