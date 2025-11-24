import { test, expect } from '../fixtures/index.js';
import { t, setupAuth } from '../utils/index.js';

// Login before each test since case detail pages require authentication
test.beforeEach(async ({ page }) => {
  await setupAuth(page);
});

const caseReference = 'PC-1922-1879'; // Default test case reference

test('financial eligibility page should display correctly', async ({ page, i18nSetup }) => {
  // Navigate to the financial eligibility page
  await page.goto(`/cases/${caseReference}/financial-eligibility`);
  
  // Check for first instance of header, which is the name
  await expect(page.getByRole('heading', { name: 'Jack Youngs' })).toBeVisible();
  
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
  
  // Check for first instance of header, which is the name
  await expect(page.getByRole('heading', { name: 'Jack Youngs' })).toBeVisible();
  
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
  
  // Check for first instance of header, which is the name
  await expect(page.getByRole('heading', { name: 'Jack Youngs' })).toBeVisible();

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