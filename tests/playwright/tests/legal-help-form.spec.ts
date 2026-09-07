import { test, expect } from '../fixtures/index.js';
import { setupAuth } from '../utils/index.js';
import { ClientDetailsPage } from '../pages/index.js';

test.describe('Legal help form journey', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test('should create a legal help form from the client details page', async ({
    page,
  }) => {
    const caseReference = 'PC-1922-1879';
    const evidence = 'Bank statements for the last 3 months';

    const clientDetails = ClientDetailsPage.forCase(page, caseReference);

    // Navigate to the client details page.
    await clientDetails.navigate();

    await expect(page).toHaveURL(`/cases/${caseReference}/client-details`);

    // Click the Get legal help form button.
    await page.getByRole('button', { name: 'Get legal help form' }).click();

    // Verify navigation to the interstitial page.
    await expect(page).toHaveURL(`/cases/${caseReference}/get-legal-help-form`);

    await expect(page.getByRole('heading', { name: 'Legal help form'})).toBeVisible();

    // Complete the evidence field.
    await page.getByLabel('What evidence do you require from the client? (optional)').fill(evidence);

    // Select one additional circumstance.
    await page.getByLabel('This is an application for Exceptional Case Funding (ECF)').check();

    // Create the legal help form.
    await page.getByRole('button', { name: 'Create legal help form'}).click();

    // Verify navigation to the generated legal help form.
    await expect(page).toHaveURL(`/cases/${caseReference}/legal-help-form`);

    await expect(page.getByRole('heading', { level: 1, name: 'Legal help form'})).toBeVisible();

    // Verify the Your details section is shown.
    await expect(page.getByRole('heading', { name: 'Your details'})).toBeVisible();

    // Verify the Finances section is shown.
    await expect(page.getByRole('table', { name: 'Finances'})).toBeVisible();
  });
});