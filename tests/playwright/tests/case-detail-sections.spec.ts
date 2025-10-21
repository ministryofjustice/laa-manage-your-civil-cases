import { test, expect } from '../fixtures/index.js';
import { t } from '../utils/index.js';

const caseReference = 'PC-1922-1879'; // Default test case reference

test('financial eligibility page should display correctly', async ({ page, i18nSetup }) => {
  // Navigate to the financial eligibility page
  await page.goto(`/cases/${caseReference}/financial-eligibility`);
  
  // Check for page heading (target the main heading with id)
  await expect(page.locator('#page-heading')).toContainText('Jack Young');
  
  // Check for back link to client details (be more specific)
  const backLink = page.locator('.govuk-back-link');
  await expect(backLink).toBeVisible();
  
  // Check for financial eligibility content
  const mainContent = page.locator('main');
  await expect(mainContent).toBeVisible();
});

test('notes and history page should display correctly', async ({ page, i18nSetup }) => {
  // Navigate to the notes and history page
  await page.goto(`/cases/${caseReference}/notes-and-history`);
  
  // Check for page heading (target the main heading with id)
  await expect(page.locator('#page-heading')).toContainText('Jack Young');
  
  // Check for back link to client details (be more specific)
  const backLink = page.locator('.govuk-back-link');
  await expect(backLink).toBeVisible();
  
  // Check for notes and history content
  const mainContent = page.locator('main');
  await expect(mainContent).toBeVisible();
});

test('scope page should display correctly', async ({ page, i18nSetup }) => {
  // Navigate to the scope page
  await page.goto(`/cases/${caseReference}/scope`);
  
  // Check for page heading (target the main heading with id)
  await expect(page.locator('#page-heading')).toContainText('Jack Young');
  
  // Check for back link to client details (be more specific)
  const backLink = page.locator('.govuk-back-link');
  await expect(backLink).toBeVisible();
  
  // Check for scope content
  const mainContent = page.locator('main');
  await expect(mainContent).toBeVisible();
});

test('case detail sections accessibility', {
  tag: '@accessibility',
}, async ({ page, checkAccessibility }) => {
  await page.goto(`/cases/${caseReference}/financial-eligibility`);
  await checkAccessibility();
  
  await page.goto(`/cases/${caseReference}/notes-and-history`);
  await checkAccessibility();
  
  await page.goto(`/cases/${caseReference}/scope`);
  await checkAccessibility();
});