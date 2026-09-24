# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth/global.setup.ts >> authenticate and save session
- Location: tests/auth/global.setup.ts:7:6

# Error details

```
TimeoutError: locator.click: Timeout 10000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Login' })
    - locator resolved to <button type="submit" data-v-10d463b7="" data-v-0af708be="" class="oxd-button oxd-button--medium oxd-button--main orangehrm-login-button">…</button>
  - attempting click action
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - performing click action
    - click action done
    - waiting for scheduled navigations to finish

```

# Test source

```ts
  1  | import { test as setup, expect } from '@playwright/test';
  2  | import * as path from 'path';
  3  | import * as fs from 'fs';
  4  | 
  5  | const SESSION_FILE = path.join(__dirname, '../../.auth/session.json');
  6  | 
  7  | setup('authenticate and save session', async ({ page }) => {
  8  |   // Ensure .auth directory exists
  9  |   fs.mkdirSync(path.dirname(SESSION_FILE), { recursive: true });
  10 | 
  11 |   await page.goto('/web/index.php/auth/login');
  12 |   await page.waitForLoadState('domcontentloaded');
  13 | 
  14 |   await page.getByPlaceholder('Username').fill('Admin');
  15 |   await page.getByPlaceholder('Password').fill('admin123');
> 16 |   await page.getByRole('button', { name: 'Login' }).click();
     |                                                     ^ TimeoutError: locator.click: Timeout 10000ms exceeded.
  17 | 
  18 |   // Wait until dashboard is loaded
  19 |   await expect(page).toHaveURL(/dashboard/);
  20 | 
  21 |   // Save storage state (cookies + localStorage)
  22 |   await page.context().storageState({ path: SESSION_FILE });
  23 | 
  24 |   console.log('Session saved to', SESSION_FILE);
  25 | });
  26 | 
```