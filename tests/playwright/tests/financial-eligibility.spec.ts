
import { test, expect } from '../fixtures/index.js';
import { setupAuth, logout, assertCaseDetailsHeaderPresent, expectPropertyTableRows, expectCaptionTableRows } from '../utils/index.js';
import { ClientDetailsPage } from '../pages/index.js';

test.describe('Details tab', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test('should navigate to financial eligibility tab', async ({ page }) => {
    const clientDetails = ClientDetailsPage.forCase(page, 'PC-1922-1879');
    // Navingate to client details page
    await clientDetails.navigate();
    // Click the financial eligiblity tab
    await page.getByRole('link', { name: 'Financial eligibility' }).click();
    // Assert the URL has change to financial eligibility tab
    await expect(page).toHaveURL(/financial-eligibility/);

    // Assert the financial eligiblity tabs are visible
    await expect(page.getByRole('tab', { name: 'Details' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Finances' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Income' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Expenses' })).toBeVisible();
  });

  test('should display assessment details', async ({ page }) => {
    const clientDetails = ClientDetailsPage.forCase(page, 'PC-1922-1879');
    // Navingate to client details page
    await clientDetails.navigate();
    // Click the financial eligiblity tab
    await page.getByRole('link', { name: 'Financial eligibility' }).click();

    // Assert the case details header is present
    await assertCaseDetailsHeaderPresent(page, { withMenuButtons: true, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 July 2025", badgeTexts: ['Urgent', 'At risk of abuse', 'Third Party'] });
    // Assert the URL has change to financial eligibility tab
    await expect(page).toHaveURL(/financial-eligibility/);

    // Assert the 'About you' header is visible
    await expect(page.getByText('About you')).toBeVisible();
    // Assert the 'Benefits' header is visible
    await expect(page.locator('caption').filter({ hasText: 'Benefits' })).toBeVisible();

    // Assert the correct data is displayed in the about you section
    await expectCaptionTableRows(page, 'About you', {
      'Are you aged 17 or under?': 'No',
      'Do you have a partner?': 'No',
      'Are you aged 60 or over?': 'No'
    });
    // Assert the correct data is displayed in the benefits section
    await expectCaptionTableRows(page, 'Benefits', {
      'Universal Credit': "No",
      'Income Support': 'No',
      'Income-based Job Seekers Allowance': 'No',
      'Guarantee State Pension Credit': 'No',
      'Income-related Employment and Support Allowance': 'No'
    });
    // Assert the edit assessment button is visible.
    await expect(page.getByRole('button', { name: 'Edit assessment' })).toBeVisible();
  });
});

test.describe('Finances tab', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });
  test('should display finances tab content with correct data when there is no partner', async ({ page }) => {
    const clientDetails = ClientDetailsPage.forCase(page, 'PC-1922-1879');
    // Navingate to client details page
    await clientDetails.navigate();
    // click to financial eligibility tab
    await page.getByRole('link', { name: 'Financial eligibility' }).click();
    // click the finances section
    await page.getByRole('tab', { name: 'Finances' }).click();
    // Assert the case details header is present
    await assertCaseDetailsHeaderPresent(page, { withMenuButtons: true, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 July 2025", badgeTexts: ['Urgent', 'At risk of abuse', 'Third Party'] });
    // Assert the Properties heading is visible. 
    await expect(page.getByRole('heading', { name: 'Properties' })).toBeVisible();
    // Assert the Your savings heading is visible.
    await expect(page.getByRole('heading', { name: 'Your savings' })).toBeVisible();
    // Assert the Disregards heading is visible.
    await expect(page.getByRole('heading', { name: 'Disregards' })).toBeVisible();

    // Assert the correct data is displayed in the properties table for the 1st and 2nd properties.
    await expectPropertyTableRows(page, '1st property', {
      'What is the current market value of the property?': '130000',
      'How much is left to pay on the mortgage?': '50000',
      'Is this your main property?': 'No',
      'What percentage of the property do you and/or your partner own?': '100%'
    });
    await expectPropertyTableRows(page, '2nd property', {
      'What is the current market value of the property?': '120000',
      'How much is left to pay on the mortgage?': '60000',
      'Is this your main property?': 'Yes',
      'What percentage of the property do you and/or your partner own?': '100%'
    });

    // Assert the correct data is displayed in the your savings table.
    await expectPropertyTableRows(page, 'Your savings', {
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

    // Assert the edit assessment button is visible.
    await expect(page.getByRole('button', { name: 'Edit assessment' })).toBeVisible();
  });

  test('should display finances tab content with correct data when there is a partner', async ({ page }) => {
    const clientDetails = ClientDetailsPage.forCase(page, 'PC-1869-9154');
    // Navingate to client details page
    await clientDetails.navigate();
    // click to financial eligibility tab
    await page.getByRole('link', { name: 'Financial eligibility' }).click();
    // click the finances section
    await page.getByRole('tab', { name: 'Finances' }).click();
    // Assert the case details header is present
    await assertCaseDetailsHeaderPresent(page, { withMenuButtons: false, expectedName: "Grace Baker", expectedCaseRef: "PC-1869-9154", dateReceived: "8 August 2025", badgeTexts: ['At risk of abuse', 'Third Party', 'Translation', 'BSL'] });
    // Assert the Properties heading is visible.
    await expect(page.getByRole('heading', { name: 'Properties' })).toBeVisible();

    // Assert the correct data is displayed in the properties table for one property.
    await expectPropertyTableRows(page, '1st property', {
      'What is the current market value of the property?': '150000',
      'How much is left to pay on the mortgage?': '60000',
      'Is this your main property?': 'Yes',
      'What percentage of the property do you and/or your partner own?': '100%'
    });

    // Assert the savings heading is visible.
    await expect(page.getByRole('heading', { name: 'Your savings' })).toBeVisible();

    // Assert the correct data is displayed in the your savings table.
    await expectPropertyTableRows(page, 'Your savings', {
      'How much was in your bank account/building society before your last payment went in?': '£100',
      'Do you have any investments, shares or ISAs?': '£300',
      'Do you have any valuable items worth over £500 each?': '£500',
      'Do you have any money owed to you?': '£100'
    });
    // Assert the correct data is displayed in the your partners savings table.
    await expectPropertyTableRows(page, 'Your partners savings', {
      'How much was in your partners bank account/building society before their last payment went in?': '£200',
      'Does your partner have any investments, shares or ISAs?': '£100',
      'Does your partner have any valuable items worth over £500 each?': '£500',
      'Does your partner have any money owed to them?': '£200'
    });
    // Assert the correct disregards are displayed in the disregards table.
    await expect(page.getByText('Cost of living payments')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit assessment' })).toBeVisible();
  });
});

test.describe('Income tab', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });
  test('should display income tab content with correct data when there is no partner', async ({ page }) => {
    const clientDetails = ClientDetailsPage.forCase(page, 'PC-1922-1879');
    // Navingate to client details page
    await clientDetails.navigate();
    // click to financial eligibility tab
    await page.getByRole('link', { name: 'Financial eligibility' }).click();
    // click the income section
    await page.getByRole('tab', { name: 'Income' }).click();
    // Assert the case details header is present
    await assertCaseDetailsHeaderPresent(page, { withMenuButtons: true, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 July 2025", badgeTexts: ['Urgent', 'At risk of abuse', 'Third Party'] });
    // Assert the your income heading is visible. 
    await expect(page.locator('caption').filter({ hasText: 'Your income' })).toBeVisible();
    // Assert the dependants heading is visible.
    await expect(page.locator('caption').filter({ hasText: 'Dependants' })).toBeVisible();

    // Assert the correct data is displayed in the income table.
    await expectCaptionTableRows(page, 'Your income', {
      'Are you self employed?': 'No',
      'What did you earn before tax? (Check your most recent payslips)': '£150 per month',
      'How much tax do you pay?': '£100 every 4 weeks',
      'How much National Insurance do you pay?': '£200 every 2 weeks',
      'Self employed drawings (before tax)': '£100 per week',
      'Benefits': '£50 per year',
      'Tax credits': '£200 per month',
      'Child benefit (for household)': '£100 per month',
      'Maintenance received': '£0 per month',
      'Pension income': '£0 per month',
      'Other income': '£0 per month'
    });

    // Assert the correct data is displayed in the dependants table.
    await expectCaptionTableRows(page, 'Dependants', {
      'Do you have any dependants aged 16 and over?': '0',
      'Do you have any dependants aged 15 and under?': '0'
    });

    // Assert the edit assessment button is visible.
    await expect(page.getByRole('button', { name: 'Edit assessment' })).toBeVisible();
  });

  test('should display income tab content with correct data when there is a partner', async ({ page }) => {
    const clientDetails = ClientDetailsPage.forCase(page, 'PC-1869-9154');
    // Navingate to client details page
    await clientDetails.navigate();
    // navigated to financial eligibility tab
    await page.getByRole('link', { name: 'Financial eligibility' }).click();
    // click the income section
    await page.getByRole('tab', { name: 'Income' }).click();
    // Assert the case details header is present
    await assertCaseDetailsHeaderPresent(page, { withMenuButtons: false, expectedName: "Grace Baker", expectedCaseRef: "PC-1869-9154", dateReceived: "8 August 2025", badgeTexts: ['At risk of abuse', 'Third Party', 'Translation', 'BSL'] });
    // Assert the your income heading is visible. 
    await expect(page.locator('caption').filter({ hasText: 'Your income' })).toBeVisible();
    // Assert the Partner's income heading is visible. 
    await expect(page.locator('caption').filter({ hasText: "Partner's income" })).toBeVisible();
    // Assert the dependants heading is visible.
    await expect(page.locator('caption').filter({ hasText: 'Dependants' })).toBeVisible();

    // Assert the correct data is displayed in the your income table.
    await expectCaptionTableRows(page, 'Your income', {
      'Are you self employed?': 'No',
      'What did you earn before tax? (Check your most recent payslips)': '£120 per month',
      'How much tax do you pay?': '£0 every 4 weeks',
      'How much National Insurance do you pay?': '£0 every 2 weeks',
      'Self employed drawings (before tax)': '£200 per week',
      'Benefits': '£500 per year',
      'Tax credits': '£100 per month',
      'Child benefit (for household)': '£200 per month',
      'Maintenance received': '£100 per month',
      'Pension income': '£100 per month',
      'Other income': '£0 per month'
    });

    // Assert the correct data is displayed in the partner's income table.
    await expectCaptionTableRows(page, "Partner's income", {
      'Is your partner self employed?': 'No',
      'What did your partner earn before tax? (Check your most recent payslips)': '£130 per month',
      'How much tax does your partner pay?': '£0 every 4 weeks',
      'How much National Insurance does your partner pay?': '£0 every 2 weeks',
      'Self employed drawings (before tax)': '£100 per week',
      'Benefits': '£500 per year',
      'Tax credits': '£200 per month',
      'Child benefit (for household)': '£300 per month',
      'Maintenance received': '£200 per month',
      'Pension income': '£200 per month',
      'Other income': '£0 per month'
    });

    // Assert the correct data is displayed in the dependants table.
    await expectCaptionTableRows(page, 'Dependants', {
      'Do you have any dependants aged 16 and over?': '2',
      'Do you have any dependants aged 15 and under?': '1'
    });
    await expect(page.getByRole('button', { name: 'Edit assessment' })).toBeVisible();
  });
});

test.describe('Expenses tab', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

   test('should display expenses tab content with correct data when there is no partner', async ({ page }) => {
    const clientDetails = ClientDetailsPage.forCase(page, 'PC-1922-1879');
    // Navingate to client details page
    await clientDetails.navigate();
    // click to financial eligibility tab
    await page.getByRole('link', { name: 'Financial eligibility' }).click();
    // click the income section
    await page.getByRole('tab', { name: 'Expenses' }).click();
    // Assert the case details header is present
    await assertCaseDetailsHeaderPresent(page, { withMenuButtons: true, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 July 2025", badgeTexts: ['Urgent', 'At risk of abuse', 'Third Party'] });
    // Assert the your income heading is visible. 
    await expect(page.locator('caption').filter({ hasText: 'Your expenses' })).toBeVisible();

    // Assert the correct data is displayed in the income table.
    await expectCaptionTableRows(page, 'Your expenses', {
      'How much do you pay for your mortgage?':	'£200 per month',
      'How much do you pay for rent? The amount entered should not include any housing benefit or payment for bills': '£0 per month',
      'How much maintenance have you paid during the last calendar month?': '£50 per month',
      'Do you have any childcare costs because of work or study? If so, how much?': '£20 per month',
      'Are you currently paying towards legal aid for criminal defence? If so, how much have you paid in the last calendar month?': '£10 per month'
    });

    // Assert the edit assessment button is visible.
    await expect(page.getByRole('button', { name: 'Edit assessment' })).toBeVisible();
  });

    test('should display income tab content with correct data when there is a partner', async ({ page }) => {
    const clientDetails = ClientDetailsPage.forCase(page, 'PC-1869-9154');
    // Navingate to client details page
    await clientDetails.navigate();
    // navigated to financial eligibility tab
    await page.getByRole('link', { name: 'Financial eligibility' }).click();
    // click the income section
    await page.getByRole('tab', { name: 'Expenses' }).click();
    // Assert the case details header is present
    await assertCaseDetailsHeaderPresent(page, { withMenuButtons: false, expectedName: "Grace Baker", expectedCaseRef: "PC-1869-9154", dateReceived: "8 August 2025", badgeTexts: ['At risk of abuse', 'Third Party', 'Translation', 'BSL'] });
  
     // Assert the your income heading is visible. 
    await expect(page.locator('caption').filter({ hasText: 'Your expenses' })).toBeVisible();
    await expect(page.locator('caption').filter({ hasText: "Your partner's expenses" })).toBeVisible();

    // Assert the correct data is displayed in the income table.
    await expectCaptionTableRows(page, 'Your expenses', {
      'How much do you pay for your mortgage?':	'£350 per month',
      'How much do you pay for rent? The amount entered should not include any housing benefit or payment for bills': '£250 per month',
      'How much maintenance have you paid during the last calendar month?': '£20 per month',
      'Do you have any childcare costs because of work or study? If so, how much?': '£50 per month',
      'Are you currently paying towards legal aid for criminal defence? If so, how much have you paid in the last calendar month?': '£20 per month'
    });
    // Assert the correct data is displayed in the income table.
    await expectCaptionTableRows(page, "Your partner's expenses", {
      'How much does your partner pay for their mortgage?':	'£300 per month',
      'How much does your partner pay for their rent? The amount entered should not include any housing benefit or payment for bills': '£200 per month',
      'How much maintenance has your partner paid during the last calendar month?': '£40 per month',
      'Does your partner have any childcare costs because of work or study? If so, how much?': '£30 per month',
      'Is your partner currently paying towards legal aid for criminal defence? If so, how much has your partner paid in the last calendar month?': '£10 per month'
    });
    await expect(page.getByRole('button', { name: 'Edit assessment' })).toBeVisible();
  });
});