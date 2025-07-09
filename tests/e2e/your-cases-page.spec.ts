import { test } from '@playwright/test';
import {
  PAGE_CONFIGS,
  YOUR_CASES_NAV_ITEMS,
  testPageHeading,
  testPageTitle,
  testSubNavigation,
  testActiveTab,
  type PageConfig
} from './shared/global-shared-test.js';
import {
  testDefaultSorting,
  testDateSorting,
} from './shared/table-sorting-shared-test.js';

// Get all case types to test
const caseTypes = Object.keys(PAGE_CONFIGS);

test.describe('Your cases Page', () => {
  // Loop through each case type and run the full test suite
  for (const caseType of caseTypes) {
    const config: PageConfig = PAGE_CONFIGS[caseType];

    test.describe(`${config.titleSuffix} Tab`, () => {
      test.beforeEach(async ({ page }) => {
        // Navigate to the specific cases page
        await page.goto(config.path);
        await page.waitForLoadState('networkidle');
      });

      test('has correct page title', async ({ page }) => {
        await testPageTitle(page, config);
      });

      test('has correct H1 text', async ({ page }) => {
        await testPageHeading(page, config);
      });

      test('has correct sub-navigation with all case types', async ({ page }) => {
        await testSubNavigation(page, YOUR_CASES_NAV_ITEMS);
      });

      test('has active tab as correct tab', async ({ page }) => {
        await testActiveTab(page, config, YOUR_CASES_NAV_ITEMS);
      });

      test.describe('sorting functionality', () => {
        test('should display dates in descending order by default', async ({ page }) => {
          await testDefaultSorting(page, config);
        });

        test('should handle sorting operations on click', async ({ page }) => {
          await testDateSorting(page, config);
        });

      });
    });
  }
});
