import { test, expect } from '../fixtures/index.js';
import { setupAuth, assertCaseDetailsHeaderPresent } from '../utils/index.js';

test.describe('why-closed page', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test('has the necessary radio buttons ', async ({ page, pages, i18nSetup }) => {
    // Visit the page
    await page.goto('/cases/PC-1922-1879/why-closed');

    // Assert the case details header is present
    await assertCaseDetailsHeaderPresent(page, { withMenuButtons: false, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 July 2025", badgeTexts: ['Urgent', 'At risk of abuse'] }); 

    const radioMeriOption = page.getByRole('radio', { name: 'Merits - not eligible' })
    const radioMisOosOption = page.getByRole('radio', { name: 'Client signposted to other' })
    const radioMisOption = page.getByRole('radio', { name: 'Refer back to the operator' })
    const radioMisMeansOption = page.getByRole('radio', { name: 'Means - not eligible' })
    const radioCoiOption = page.getByRole('radio', { name: 'Conflict of interest' })
    const radioDuplOption = page.getByRole('radio', { name: 'Duplicate case' })
    const radioClotOption = page.getByRole('radio', { name: 'Other', exact: true })


    await expect(radioMeriOption).toBeVisible();
    await expect(radioMisOosOption).toBeVisible();
    await expect(radioMisOption).toBeVisible();
    await expect(radioMisMeansOption).toBeVisible();
    await expect(radioCoiOption).toBeVisible();
    await expect(radioDuplOption).toBeVisible();
    await expect(radioClotOption).toBeVisible();
  });

  test('why-closed page is accessible', {
    tag: '@accessibility',
  }, async ({ pages, checkAccessibility }) => {
    await pages.closeCaseForm.navigate();
    await checkAccessibility();
  });
});