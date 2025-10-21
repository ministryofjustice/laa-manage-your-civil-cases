import { test, expect } from '../fixtures/index.js';
import { t } from '../utils/index.js';

test('new cases listing page should display correctly', async ({ page, i18nSetup }) => {
  // Navigate to the new cases page
  await page.goto('/cases/new');
  
  // Check for page heading
  await expect(page.locator('h1')).toContainText('New cases');
  
  // Check for the specific new cases table
  const caseTable = page.locator('#new-cases-table');
  await expect(caseTable).toBeVisible();
});

test('opened cases listing page should display correctly', async ({ page, i18nSetup }) => {
  // Navigate to the opened cases page
  await page.goto('/cases/opened');
  
  // Check for page heading
  await expect(page.locator('h1')).toContainText('Opened cases');
  
  // Check for the specific opened cases table
  const caseTable = page.locator('#opened-cases-table');
  await expect(caseTable).toBeVisible();
});

test('accepted cases listing page should display correctly', async ({ page, i18nSetup }) => {
  // Navigate to the accepted cases page
  await page.goto('/cases/accepted');
  
  // Check for page heading
  await expect(page.locator('h1')).toContainText('Accepted cases');
  
  // Check for the specific accepted cases table
  const caseTable = page.locator('#accepted-cases-table');
  await expect(caseTable).toBeVisible();
});

test('closed cases listing page should display correctly', async ({ page, i18nSetup }) => {
  // Navigate to the closed cases page
  await page.goto('/cases/closed');
  
  // Check for page heading
  await expect(page.locator('h1')).toContainText('Closed cases');
  
  // Check for the specific closed cases table
  const caseTable = page.locator('#closed-cases-table');
  await expect(caseTable).toBeVisible();
});

test('case listing accessibility', {
  tag: '@accessibility',
}, async ({ page, checkAccessibility }) => {
  await page.goto('/cases/new');
  await checkAccessibility();
});