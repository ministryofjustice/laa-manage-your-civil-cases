import { test, expect } from '../fixtures/index.js';
import { setupAuth } from '../utils/index.js';

// Login before each test since all case listing pages require authentication
test.beforeEach(async ({ page }) => {
  await setupAuth(page);
});

test('new cases listing page should display correctly', async ({ page, i18nSetup }) => {
  // Navigate to the new cases page
  await page.goto('/cases/new');

  // Check for main page heading
  await expect(page.locator('h1')).toContainText('Your cases');

  // Check for case type heading
  await expect(page.locator('h2')).toContainText('New');

  // Check for the specific new cases table
  const caseTable = page.locator('#new-cases-table');
  await expect(caseTable).toBeVisible();
});

test('pending cases listing page should display correctly', async ({ page, i18nSetup }) => {
  // Navigate to the pending cases page
  await page.goto('/cases/pending');

  // Check for main page heading
  await expect(page.locator('h1')).toContainText('Your cases');

  // Check for case type heading
  await expect(page.locator('h2')).toContainText('Pending');

  // Check for the specific pending cases table
  const caseTable = page.locator('#pending-cases-table');
  await expect(caseTable).toBeVisible();
});

test('advising cases listing page should display correctly', async ({ page, i18nSetup }) => {
  // Navigate to the advising cases page
  await page.goto('/cases/advising');

  // Check for main page heading
  await expect(page.locator('h1')).toContainText('Your cases');

  // Check for case type heading
  await expect(page.locator('h2')).toContainText('Advising');

  // Check for the specific advising cases table
  const caseTable = page.locator('#advising-cases-table');
  await expect(caseTable).toBeVisible();
});

test('closed cases listing page should display correctly', async ({ page, i18nSetup }) => {
  // Navigate to the closed cases page
  await page.goto('/cases/closed');

  // Check for main page heading
  await expect(page.locator('h1')).toContainText('Your cases');

  // Check for case type heading
  await expect(page.locator('h2')).toContainText('Closed');

  // Check for the specific closed cases table
  const caseTable = page.locator('#closed-cases-table');
  await expect(caseTable).toBeVisible();
});

test('completed cases listing page should display correctly', async ({ page, i18nSetup }) => {
  // Navigate to the completed cases page
  await page.goto('/cases/completed');

  // Check for main page heading
  await expect(page.locator('h1')).toContainText('Your cases');

  // Check for case type heading
  await expect(page.locator('h2')).toContainText('Completed');

  // Check for the specific completed cases table
  const caseTable = page.locator('#completed-cases-table');
  await expect(caseTable).toBeVisible();
});

test('case listing accessibility', {
  tag: '@accessibility',
}, async ({ page, checkAccessibility }) => {
  await page.goto('/cases/new');
  await checkAccessibility();
});