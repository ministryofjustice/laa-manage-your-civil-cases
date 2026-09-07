import { test, expect } from '../fixtures/index.js';
import { setupAuth, expectPropertyTableRows, expectCaptionTableRows } from '../utils/index.js';
import { ClientDetailsPage } from '../pages/index.js';

test.describe('Legal help form journey', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test('should create a legal help form from the client details page', async ({
    page,
  }) => {
    const caseReference = 'PC-9173-4826';
    const evidence = 'Bank statements for the last 3 months';

    const clientDetails = ClientDetailsPage.forCase(page, caseReference);

    // Navigate to the client details page.
    await clientDetails.navigate();

    await expect(page).toHaveURL(`/cases/${caseReference}/client-details`);

    // Click the Get legal help form button.
    await page.getByRole('button', { name: 'Get legal help form' }).click();

    // Verify navigation to the interstitial page.
    await expect(page).toHaveURL(`/cases/${caseReference}/get-legal-help-form`);

    await expect(page.getByRole('heading', { name: 'Legal help form' })).toBeVisible();

    // Complete the evidence field.
    await page.getByLabel('What evidence do you require from the client? (optional)').fill(evidence);

    // Select one additional circumstance.
    await page.getByLabel('This is an application for Exceptional Case Funding (ECF)').check();

    // Create the legal help form.
    await page.getByRole('button', { name: 'Create legal help form' }).click();

    // Verify navigation to the generated legal help form.
    await expect(page).toHaveURL(`/cases/${caseReference}/legal-help-form`);

    await expect(page.getByRole('heading', { level: 1, name: 'Legal help form' })).toBeVisible();

    await expectCaptionTableRows(page, 'Your details', {
      'Full name': 'Ian Phillips',
      'Date of birth': '19 Dec 1991',
      'National Insurance number': 'AB123456C',
      'Current address': '38 Oak Avenue, Sheffield',
      'Postcode': 'NE1 8DR',
      'LAA reference': '3767316',
    });

    await expectCaptionTableRows(page, 'Your finances', {
      'Are you aged 17 or under?': 'No',
      'Do you have a partner?': 'No',
      'Are you aged 60 or over?': 'No',
      'Universal Credit': 'No',
      'Income Support': 'No',
      'Income-based Job Seekers Allowance': 'No',
      'Guarantee State Pension Credit': 'No',
      'Income-related Employment and Support Allowance': 'No',
    });
  });
});