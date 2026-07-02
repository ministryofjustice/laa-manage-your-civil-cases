
import { test, expect } from '../fixtures/index.js';
import { setupAuth, logout, assertCaseDetailsHeaderPresent, expectTableRows, expectPropertyTableRows } from '../utils/index.js';
import { ClientDetailsPage } from '../pages/index.js';

test.describe('Case details tab', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test('should navigate to financial eligibility tab', async ({ page }) => {
    const clientDetails = ClientDetailsPage.forCase(page, 'PC-1922-1879');

    await clientDetails.navigate();

    await page.getByRole('link', { name: 'Financial eligibility' }).click();

    await expect(page).toHaveURL(/financial-eligibility/);

    await expect(page.getByRole('tab', { name: 'Details' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Finances' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Income' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Expenses' })).toBeVisible();
  });

  test('should display assessment details', async ({ page }) => {
    const clientDetails = ClientDetailsPage.forCase(page, 'PC-1922-1879');

    await clientDetails.navigate();

    await page.getByRole('link', { name: 'Financial eligibility' }).click();

    // Assert the case details header is present
    await assertCaseDetailsHeaderPresent(page, { withMenuButtons: true, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 July 2025", badgeTexts: ['Urgent', 'At risk of abuse', 'Third Party'] });

    await expect(page).toHaveURL(/financial-eligibility/);

    await expect(page.getByText('About you')).toBeVisible();
    await expect(page.locator('caption').filter({ hasText: 'Benefits' })).toBeVisible();

    await expectTableRows(page, 'details', {
      'Are you aged 17 or under?': 'No',
      'Do you have a partner?': 'No',
      'Are you aged 60 or over?': 'No',
      'Universal Credit': 'No',
      'Income Support': 'No',
      'Income-based Job Seekers Allowance': 'No',
      'Guarantee State Pension Credit': 'No',
      'Income-related Employment and Support Allowance': 'No'
    });

    await expect(page.getByRole('button', { name: 'Edit assessment' })).toBeVisible();

  });

  test('should display finances tab content with correct data when there is no partner', async ({ page }) => {
    const clientDetails = ClientDetailsPage.forCase(page, 'PC-1922-1879');

    await clientDetails.navigate();

    // navigated to financial eligibility tab
    await page.getByRole('link', { name: 'Financial eligibility' }).click();

    // click the finances section
    await page.getByRole('tab', { name: 'Finances' }).click();

    // Assert the Properties heading is visible. 
    await expect(page.getByRole('heading', { name: 'Properties' })).toBeVisible();
    // Assert the Your savings heading is visible.
    await expect(page.getByRole('heading', { name: 'Your savings' })).toBeVisible();
    // Assert the Disregards heading is visible.
    await expect(page.getByRole('heading', { name: 'Disregards' })).toBeVisible();

    // Assert the correct data is displayed in the properties table for the 1st and 2nd properties.
    await expectPropertyTableRows(page, '1st property', {
      'What is the current market value of the property?': '13000000',
      'How much is left to pay on the mortgage?': '5000000',
      'Is this your main property?': 'No',
      'What percentage of the property do you and/or your partner own?': '100%'
    });
    await expectPropertyTableRows(page, '2nd property', {
      'What is the current market value of the property?': '12000000',
      'How much is left to pay on the mortgage?': '6000000',
      'Is this your main property?': 'Yes',
      'What percentage of the property do you and/or your partner own?': '100%'
    });

    // Assert the correct data is displayed in the finances table.
    await expectTableRows(page, 'finances', {
      'How much was in your bank account/building society before your last payment went in?': '£200',
      'Do you have any investments, shares or ISAs?': '£100',
      'Do you have any valuable items worth over £500 each?': '£500',
      'Do you have any money owed to you?': '£200',
    });

    // Assert the correct data is displayed in the disregards table.
    await expect(page.getByText('Vaccine damage payment')).toBeVisible();
    await expect(page.getByText('Cost of living payments')).toBeVisible();
    await expect(page.getByText('National emergencies trust')).toBeVisible();
    await expect(page.getByText('vCJD Trust')).toBeVisible();
    await expect(page.getByText('Infected Blood Support Scheme')).toBeVisible();
    await expect(page.getByText('Backdated child maintenance payments')).toBeVisible();
    await expect(page.getByText('Backdated benefit payments')).toBeVisible();
    await expect(page.getByText('Scotland and Northern Ireland redress schemes for historical child abuse')).toBeVisible();
    await expect(page.getByText('Grenfell Tower compensation')).toBeVisible();
    await expect(page.getByText('London Emergencies Trust')).toBeVisible();
    await expect(page.getByText('Miscarriage of justice compensation')).toBeVisible();
    await expect(page.getByText('We Love Manchester Emergency Fund')).toBeVisible();
    await expect(page.getByText('Victims of Overseas Terrorism Compensation Scheme (VOTCS)')).toBeVisible();
    await expect(page.getByText('The Energy Support Scheme payments (2022 and 2023)')).toBeVisible();
    await expect(page.getByText('Criminal Injuries Compensation Scheme')).toBeVisible();
    await expect(page.getByText('Modern Slavery Victim Care Contract or National Referral Mechanism (NRM)')).toBeVisible();

    await expect(page.getByRole('button', { name: 'Edit assessment' })).toBeVisible();
  });

  test('should display finances tab content with correct data when there is a partner', async ({ page }) => {
    const clientDetails = ClientDetailsPage.forCase(page, 'PC-1869-9154');

    await clientDetails.navigate();

    // navigated to financial eligibility tab
    await page.getByRole('link', { name: 'Financial eligibility' }).click();

    // click the finances section
    await page.getByRole('tab', { name: 'Finances' }).click();

    // Assert the case details header is present
    await assertCaseDetailsHeaderPresent(page, { withMenuButtons: false, expectedName: "Grace Baker", expectedCaseRef: "PC-1869-9154", dateReceived: "8 August 2025", badgeTexts: ['At risk of abuse', 'Third Party', 'Translation', 'BSL'] });

    // Assert the Properties heading is visible.
    await expect(page.getByRole('heading', { name: 'Properties' })).toBeVisible();

    // Assert the correct data is displayed in the properties table for the 1st and 2nd properties.
    await expectPropertyTableRows(page, '1st property', {
      'What is the current market value of the property?': '15000000',
      'How much is left to pay on the mortgage?': '6000000',
      'Is this your main property?': 'Yes',
      'What percentage of the property do you and/or your partner own?': '100%'
    });

    // Assert the savings heading is visible.
    await expect(page.getByRole('heading', { name: 'Your savings' })).toBeVisible();

    // Assert the correct data is displayed in the finances table.
    await expectPropertyTableRows(page, 'Your savings', {
      'How much was in your bank account/building society before your last payment went in?': '£100',
      'Do you have any investments, shares or ISAs?': '£300',
      'Do you have any valuable items worth over £500 each?': '£500',
      'Do you have any money owed to you?': '£100'
    });
     // Assert the correct data is displayed in the finances table.
    await expectPropertyTableRows(page, 'Your partners savings', {
      'How much was in your partners bank account/building society before their last payment went in?': '£200',
      'Does your partner have any investments, shares or ISAs?': '£100',
      'Does your partner have any valuable items worth over £500 each?': '£500',
      'Does your partner have any money owed to them?': '£200'
    });

    await expect(page.getByText('Cost of living payments')).toBeVisible();

    await expect(page.getByRole('button', { name: 'Edit assessment' })).toBeVisible();
  });

});
