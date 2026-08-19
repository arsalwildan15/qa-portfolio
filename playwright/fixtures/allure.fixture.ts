import { test as base } from '@playwright/test';
import { allure } from 'allure-playwright';
import * as path from 'path';

/**
 * Auto-annotates Allure metadata (Epic, Feature, Story, Severity, Tags)
 * based on the test file path — no need to edit individual spec files.
 *
 * Path convention:
 *   tests/{epic}/{feature}/{story}.spec.ts
 *
 * Example:
 *   tests/leave/apply-leave/valid-flow.spec.ts
 *   → Epic: Leave, Feature: Apply Leave, Story: valid-flow
 */

type AllureFixtures = {
  autoAnnotate: void;
};

export const test = base.extend<AllureFixtures>({
  autoAnnotate: [async ({}, use, testInfo) => {
    const relativePath = path.relative(
      path.join(__dirname, '..', 'tests'),
      testInfo.file,
    );

    // Split path into parts: [epic, feature?, story?]
    const parts = relativePath.replace(/\\/g, '/').split('/');

    const epic    = parts[0]  ? capitalize(parts[0].replace(/-/g, ' '))  : 'General';
    const feature = parts[1]  ? capitalize(parts[1].replace(/-/g, ' '))  : epic;
    const story   = parts[2]  ? capitalize(parts[2].replace(/\.spec\.ts$/, '').replace(/-/g, ' ')) : testInfo.title;

    await allure.epic(epic);
    await allure.feature(feature);
    await allure.story(story);
    await allure.tag('OrangeHRM');
    await allure.tag('Portfolio');

    // Assign severity based on folder name keywords
    if (/auth|login/i.test(epic)) {
      await allure.severity('critical');
    } else if (/leave|recruitment/i.test(epic)) {
      await allure.severity('normal');
    } else {
      await allure.severity('minor');
    }

    await use();
  }, { auto: true }],
});

export { expect } from '@playwright/test';

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
