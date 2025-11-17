import { test, expect } from '../fixtures/index.js';
import { t, setupAuth } from '../utils/index.js';

// Login before each test since all case listing pages require authentication
test.beforeEach(async ({ page }) => {
  await setupAuth(page);
});

test('new cases listing page should display correctly', async ({ page, i18nSetup }) => {
  // Navigate to the new cases page
  await page.goto('/cases/new');
  
  // Check for page heading
  await expect(page.locator('h1')).toContainText('New cases');
  
  // Check for the specific new cases table
  const caseTable = page.locator('#new-cases-table');
  await expect(caseTable).toBeVisible();
});

test('pending cases listing page should display correctly', async ({ page, i18nSetup }) => {
  // Navigate to the pending cases page
  await page.goto('/cases/pending');
  
  // Check for page heading
  await expect(page.locator('h1')).toContainText('Pending cases');
  
  // Check for the specific pending cases table
  const caseTable = page.locator('#pending-cases-table');
  await expect(caseTable).toBeVisible();
});

test('advising cases listing page should display correctly', async ({ page, i18nSetup }) => {
  // Navigate to the advising cases page
  await page.goto('/cases/advising');
  
  // Check for page heading
  await expect(page.locator('h1')).toContainText('Advising cases');
  
  // Check for the specific advising cases table
  const caseTable = page.locator('#advising-cases-table');
  await expect(caseTable).toBeVisible();
});

// TO-DO as `rejected` does not exist as a valid filter on api endpoint, the `rejected` activeTab will never show
// test('closed cases listing page should display correctly', async ({ page, i18nSetup }) => {
//   // Navigate to the closed cases page
//   await page.goto('/cases/closed');
  
//   // Check for page heading
//   await expect(page.locator('h1')).toContainText('Closed cases');
  
//   // Check for the specific closed cases table
//   const caseTable = page.locator('#closed-cases-table');
//   await expect(caseTable).toBeVisible();
// });

test('completed cases listing page should display correctly', async ({ page, i18nSetup }) => {
  // Navigate to the completed cases page
  await page.goto('/cases/completed');
  
  // Check for page heading
  await expect(page.locator('h1')).toContainText('Completed cases');
  
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