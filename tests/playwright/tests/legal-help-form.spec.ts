import { test, expect } from '../fixtures/index.js';
import { Page } from '@playwright/test';
import { setupAuth, expectPropertyTableRows, expectCaptionTableRows } from '../utils/index.js';
import { ClientDetailsPage } from '../pages/index.js';

test.describe('Legal help form journey', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  async function navigateToLegalHelpForm(
    page: Page,
    caseReference: string,
  ): Promise<void> {
    const clientDetails = ClientDetailsPage.forCase(
      page,
      caseReference,
    );

    await clientDetails.navigate();

    await page.getByRole('button', { name: 'Get legal help form' }).click();

    await expect(page).toHaveURL(
      `/cases/${caseReference}/get-legal-help-form`,
    );

    await page.getByRole('button', { name: 'Create legal help form' }).click();

    await expect(page).toHaveURL(`/cases/${caseReference}/legal-help-form`);
  }

  test('should create a legal help form with your details and your finances sections', async ({ page }) => {
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

  test.describe('Legal help form conditional financial details', () => {
    test.beforeEach(async ({ page }) => {
      await setupAuth(page);
    });

    test('should show only the under-18 questions when the client is under-18 passported', async ({ page }) => {
      const caseReference = 'PC-6667-9089';

      await navigateToLegalHelpForm(page, caseReference);

      const financesTable = page.getByRole('table', { name: 'Your finances' });

      await expect(financesTable).toBeVisible();

      await expectCaptionTableRows(page, 'Your finances', {
        'Are you aged 17 or under?': 'Yes',
        'Do you receive any money on a regular basis?': 'No',
        'Do you have any savings, items of value or investments totalling £2500 or more?':
          'No',
      });

      await expect(financesTable.getByRole('row', { name: "Do you have a partner?" })).toHaveCount(0);

      await expect(financesTable.getByRole('row', { name: "Are you aged 60 or over?" })).toHaveCount(0);

      await expect(
        financesTable.getByRole('row', { name: "Universal Credit" })).toHaveCount(0);
    });

    test('should show partner and age questions when an under-18 client receives regular payments', async ({ page }) => {
      const caseReference = 'PC-1854-6521';

      await navigateToLegalHelpForm(page, caseReference);

      await expectCaptionTableRows(page, 'Your finances', {
        'Are you aged 17 or under?': 'Yes',
        'Do you receive any money on a regular basis?': 'Yes',
        'Do you have a partner?': 'No',
        'Are you aged 60 or over?': 'No',
      });

      const financesTable = page.getByRole('table', { name: 'Your finances' });

      await expect(financesTable.getByRole('row', { name: "Do you have any savings, items of value or investments totalling £2500 or more?" })).toHaveCount(0);
    });

    test('should show valuables, partner and age questions when an under-18 client has valuables', async ({ page }) => {
      const caseReference = 'PC-2211-4466';

      await navigateToLegalHelpForm(page, caseReference);

      await expectCaptionTableRows(page, 'Your finances', {
        'Are you aged 17 or under?': 'Yes',
        'Do you receive any money on a regular basis?': 'No',
        'Do you have any savings, items of value or investments totalling £2500 or more?':
          'Yes',
        'Do you have a partner?': 'No',
        'Are you aged 60 or over?': 'No',
      });
    });

    test('should use the single-client age and benefits wording when there is no partner', async ({ page }) => {
      const caseReference = 'PC-1922-1879';

      await navigateToLegalHelpForm(page, caseReference);

      await expectCaptionTableRows(page, 'Your finances', {
        'Are you aged 17 or under?': 'No',
        'Do you have a partner?': 'No',
        'Are you aged 60 or over?': 'No',
        'Universal Credit': 'Yes',
        'Income Support': 'No',
        'Income-based Job Seekers Allowance': 'Yes',
        'Guarantee State Pension Credit': 'No',
        'Income-related Employment and Support Allowance': 'No',
      });

      const financesTable = page.getByRole('table', { name: 'Your finances' });

      await expect(financesTable.getByText('Do you or your partner receive any of the following benefits:', { exact: true })).toHaveCount(0);

      await expect(financesTable.getByText('Are you or your partner aged 60 or over?', { exact: true })).toHaveCount(0);
    });

    test('should use the partner age and benefits wording when the client has a partner', async ({ page }) => {
      const caseReference = 'PC-1869-9154';

      await navigateToLegalHelpForm(page, caseReference);

      await expectCaptionTableRows(page, 'Your finances', {
        'Are you aged 17 or under?': 'No',
        'Do you have a partner?': 'Yes',
        'Are you or your partner aged 60 or over?': 'No',
      });

      const financesTable = page.getByRole('table', { name: 'Your finances' });

      await expect(financesTable.getByText('Do you or your partner receive any of the following benefits:', { exact: true })).toBeVisible();

      await expect(financesTable.getByText('Are you aged 60 or over?', { exact: true })).toHaveCount(0);
    });
  });

  test('should only display your details when hasPassportedProceedingsLetter is true', async ({ page }) => {
    const caseReference = 'PC-4575-7150';

    await navigateToLegalHelpForm(page, caseReference);

    await expect(page.getByRole('heading', { level: 1, name: 'Legal help form' })).toBeVisible();

    // Details section should exist
    await expect(page.locator('caption').filter({ hasText: 'Your details' })).toBeVisible();

    // Finances section should not exist
    await expect(page.locator('caption').filter({ hasText: 'Your finances' })).toHaveCount(0);

    // No financial questions should be rendered
    await expect(page.getByText('Are you aged 17 or under?')).toHaveCount(0);

    await expect(page.getByText('Do you have a partner?')).toHaveCount(0);

    await expect(page.getByText('Universal Credit')).toHaveCount(0);
  });

  test('should display not provided when NI number, address and postcode are missing', async ({ page, }) => {
    const caseReference = 'PC-1735-6182';

    await navigateToLegalHelpForm(page, caseReference);

    await expectCaptionTableRows(page, 'Your details', {
      'National Insurance number': 'Not provided',
      'Current address': 'Not provided',
      'Postcode': 'Not provided',
    });
  });

  test.describe('Legal help form property details', () => {
    test.beforeEach(async ({ page }) => {
      await setupAuth(page);
    });

    test('should show no when the client does not own any property', async ({ page }) => {
      const caseReference = 'PC-1854-6521';

      await navigateToLegalHelpForm(page, caseReference);

      await expectCaptionTableRows(page, 'Your property', { 'Do you own any property?': 'No' });

      await expect(page.getByRole('heading', { name: 'Main property' })).toHaveCount(0);

      await expect(page.getByRole('heading', { name: 'Additional property' })).toHaveCount(0);
    });

    test('should display the main property details', async ({ page }) => {
      const caseReference = 'PC-9173-4826';

      await navigateToLegalHelpForm(page, caseReference);

      await expectCaptionTableRows(page, 'Your property', { 'Do you own any property?': 'Yes' });

      await expect(page.getByRole('heading', { name: 'Main property' })).toBeVisible();

      await expectPropertyTableRows(page, 'Main property', {
        'Property value': '£150,000',
        'Outstanding mortgage': '£60,000',
        'Percentage share': '100%'
      });
    });

    test('should display additional properties', async ({ page }) => {
      const caseReference = 'PC-1922-1879';

      await navigateToLegalHelpForm(page, caseReference);

      await expectPropertyTableRows(page, 'Main property', {
        'Property value': '£120,000',
        'Outstanding mortgage': '£60,000',
        'Percentage share': '100%'
      });

      await expectPropertyTableRows(page, 'Additional property 1', {
        'Property value': '£130,000',
        'Outstanding mortgage': '£50,000',
        'Percentage share': '100%'
      });
    });

    test('should show disputed property question for debt cases', async ({ page }) => {
      const caseReference = 'PC-1977-1241'; // debt case

      await navigateToLegalHelpForm(page, caseReference);

      await expectPropertyTableRows(page, 'Main property', {'Is this property disputed?': 'No'});

      await expectPropertyTableRows(page, 'Additional property 1', {'Is this property disputed?': 'Yes'});
    });

    test('should show disputed property question for family cases', async ({ page }) => {
      const caseReference = 'PC-1924-9560'; // family case

      await navigateToLegalHelpForm(page, caseReference);

      await expectPropertyTableRows(page, 'Main property', {'Is this property disputed?': 'Yes'});
    });
  });
});