import { test, expect } from '../fixtures/index.js';
import { setupAuth } from '../utils/index.js';

// Login before each test since all case listing pages require authentication
test.beforeEach(async ({ page }) => {
  await setupAuth(page);
});

test.describe('new cases listing page', () => {
  test('should display correctly', async ({ page }) => {
    // Navigate to the new cases page
    await page.goto('/cases/new');

    // Check for main page heading
    await expect(page.locator('h1')).toContainText('Your cases');

    // Check for case type heading
    await expect(page.locator('h2.govuk-heading-m')).toContainText('New');

    // Check for the specific new cases table
    const caseTable = page.locator('#new-cases-table');
    await expect(caseTable).toBeVisible();
  });

  test('should display correct case flags [Urgent, At risk of abuse, Third party] for Jack Youngs', async ({ page }) => {
    // Navigate to the new cases page
    await page.goto('/cases/new');

    // Select the row for Jack Youngs
    const jackRow = page
      .getByRole('row')
      .filter({ hasText: 'Jack Youngs' });

    // Assert the expected flags are visible. 
    await expect(jackRow.getByText('Urgent')).toBeVisible();
    await expect(jackRow.getByText('At risk of abuse')).toBeVisible();
    await expect(jackRow.getByText('Third party')).toBeVisible();

    // Check for the specific new cases table
    const caseTable = page.locator('#new-cases-table');
    await expect(caseTable).toBeVisible();
  });

  test('should display correct case flags [Second opinion] for Barbara white', async ({ page }) => {
    // Navigate to the new cases page
    await page.goto('/cases/new');

    // Check for `Second opinion` flag 
    const secondOpinion = page.getByText('Second opinion')
    await expect(secondOpinion).toBeVisible()

    // Check for the specific new cases table
    const caseTable = page.locator('#new-cases-table');
    await expect(caseTable).toBeVisible();
  });

  test('should display correct case flags [Translation, BSL, TextRelay] for Vinsmoke Sanji', async ({ page }) => {
    // Navigate to the new cases page
    await page.goto('/cases/new');

    // Check for `Translation` flag 
    const translation = page.getByText('Translation').nth(1)
    await expect(translation).toBeVisible()

    // Check for `BSL` flag 
    const bsl = page.getByText('BSL', { exact: true })
    await expect(bsl).toBeVisible()

    // Check for `TextRelay` flag 
    const textRelay = page.getByText('Text relay').nth(1)
    await expect(textRelay).toBeVisible()

    // Check for the specific new cases table
    const caseTable = page.locator('#new-cases-table');
    await expect(caseTable).toBeVisible();
  });
});

test.describe('pending cases listing page', () => {
  test('should display correctly', async ({ page }) => {
    // Navigate to the pending cases page
    await page.goto('/cases/pending');

    // Check for main page heading
    await expect(page.locator('h1')).toContainText('Your cases');

    // Check for case type heading
    await expect(page.locator('h2.govuk-heading-m')).toContainText('Pending');

    // Check for the specific pending cases table
    const caseTable = page.locator('#pending-cases-table');
    await expect(caseTable).toBeVisible();
  });

  test('should display correct case flags [Manually assigned] for Ian Phillips', async ({ page }) => {
    // Navigate to the pending cases page
    await page.goto('/cases/pending');

    // Check for `Manually assigned` flag 
    const manuallyAssigned = page.getByText('Manually assigned');
    await expect(manuallyAssigned).toBeVisible()

    // Check for the specific pending cases table
    const caseTable = page.locator('#pending-cases-table');
    await expect(caseTable).toBeVisible();
  });
});

test('advising cases listing page should display correctly', async ({ page, i18nSetup }) => {
  // Navigate to the advising cases page
  await page.goto('/cases/advising');

  // Check for main page heading
  await expect(page.locator('h1')).toContainText('Your cases');

  // Check for case type heading
  await expect(page.locator('h2.govuk-heading-m')).toContainText('Advising');

  // Check for the specific advising cases table
  const caseTable = page.locator('#advising-cases-table');
  await expect(caseTable).toBeVisible();
});

test.describe('closed cases listing page ', () => {
  test('should display correctly', async ({ page }) => {
    // Navigate to the closed cases page
    await page.goto('/cases/closed');

    // Check for main page heading
    await expect(page.locator('h1')).toContainText('Your cases');

    // Check for case type heading
    await expect(page.locator('h2.govuk-heading-m')).toContainText('Closed');

    // Check for the specific closed cases table
    const caseTable = page.locator('#closed-cases-table');
    await expect(caseTable).toBeVisible();
  });

  test('should NOT display case flags [Second opinion] for Roronoa Zoro', async ({ page }) => {
    // Navigate to the closed cases page
    await page.goto('/cases/closed');

    // Check for `Second opinion` flag 
    const secondOpinion = page.getByText('Second opinion')
    await expect(secondOpinion).not.toBeVisible()

    // Check for the specific closed cases table
    const caseTable = page.locator('#closed-cases-table');
    await expect(caseTable).toBeVisible();
  });

  test('should NOT display case flags [Manually assigned] for Noah Brown', async ({ page }) => {
    // Navigate to the closed cases page
    await page.goto('/cases/closed');

    // Check for `Manually assigned` flag 
    const manuallyAssigned = page.getByText('Manually assigned');
    await expect(manuallyAssigned).not.toBeVisible()

    // Check for the specific closed cases table
    const caseTable = page.locator('#closed-cases-table');
    await expect(caseTable).toBeVisible();
  });
});

test('completed cases listing page should display correctly', async ({ page, i18nSetup }) => {
  // Navigate to the completed cases page
  await page.goto('/cases/completed');

  // Check for main page heading
  await expect(page.locator('h1')).toContainText('Your cases');

  // Check for case type heading
  await expect(page.locator('h2.govuk-heading-m')).toContainText('Completed');

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