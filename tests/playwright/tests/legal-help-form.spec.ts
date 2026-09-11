import { test, expect } from '../fixtures/index.js';
import { Page } from '@playwright/test';
import { setupAuth, expectPropertyTableRows, expectHeadingTableRows, expectCaptionTableRows, expectCapitalTableRows, expectTableRows } from '../utils/index.js';
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
    const caseReference = 'PC-9173-4826'; // No Partner case
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

    // Your details table
    await expectCaptionTableRows(page, 'Your details', {
      'Full name': 'Ian Phillips',
      'Date of birth': '19 Dec 1991',
      'National Insurance number': 'AB123456C',
      'Current address': '38 Oak Avenue, Sheffield',
      'Postcode': 'NE1 8DR',
      'LAA reference': '3767316',
    });

    // Your finances table
    await expectCaptionTableRows(page, 'Your finances', {
      'Are you aged 17 or under?': 'No',
      'Do you have a partner?': 'No',
      'Are you aged 60 or over?': 'No',
    });

    // Benefits table
    await expectCaptionTableRows(page, 'Do you receive any of the following benefits:', {
      'Universal Credit': 'No',
      'Income Support': 'No',
      'Income-based Job Seekers Allowance': 'No',
      'Guarantee State Pension Credit': 'No',
      'Income-related Employment and Support Allowance': 'No',
    });

    // Property table
    await expectCaptionTableRows(page, 'Your property', { 'Do you own any property?': 'Yes' });

    // Property text
    await expect(page.getByText('We disregard up to £100,000 of the equity of your main home.')).toBeVisible();

    // Main property
    await expectPropertyTableRows(page, 'Main property', {
      'Property value': '£150,000',
      'Outstanding mortgage': '£60,000',
      'Percentage share': '100%',
    });

    // Total equity table
    await expectCaptionTableRows(page, 'Total equity', { 'Total equity in homes for assessment purposes': '£0' });

    // Capital table 
    await expectCapitalTableRows(page, {
      "Savings": '£100',
      "Investments": '£300',
      'Valuable Items': '£500',
      'Other capital': '£100',
      'Pensioner capital disregard': '£0',
      'Total capital for assessment purposes': '£1,000',
    });

    // Income table
    await expectHeadingTableRows(page, 'Your income', {
      'Wages (before tax)': '£120',
      'Self employed drawings (before tax)': '£200',
      'Benefits': '£500',
      'Tax credits': '£100',
      'Child benefit (for household)': '£200',
      'Maintenance received': '£100',
      'Pension income': '£100',
      'Other income': '£0',
      'Total income': '£887.49',
    });

    // less monthly allowances table
    await expectHeadingTableRows(page, 'Less monthly allowances', {
      'Tax': '£0',
      'National Insurance': '£0',
      'Mortgage': '£350',
      'Rent': '£250',
      'Maintenance payments being made': '£50',
      'Childcare costs due to work': '£50',
      'Legal Aid payments for criminal defence': '£20',
    });

    // Calculated expenses
    await expectHeadingTableRows(page, 'Calculated expenses', { 'Employment expenses': '£45' });

    const calculatedExpensesTable = page.getByRole('heading', { name: 'Calculated expenses' }).locator('xpath=following-sibling::table[1]');
    const totalTable = calculatedExpensesTable.locator('xpath=following-sibling::table[1]');
    await expectTableRows(totalTable, {
      'Dependants allowance': '£0',
      'Total monthly disposable income': '£0',
    });

    // Evidence can be seen in evidence box
    await expect(page.getByRole('heading', { name: 'Evidence we need from you' })).toBeVisible();
    await expect(page.locator('#more-detail')).toHaveValue(evidence);

    // One additional circumstance, shown on Legal Help Form
    await expectHeadingTableRows(page, 'For use by advisor', { 'Is this an application for exceptional case funding (ECF)?': 'Yes' });

    // Other advisor circumstances remain unselected
    const advisorHeading = page.getByRole('heading', { name: 'For use by advisor' });
    const secondAdvisorTable = advisorHeading.locator('xpath=following-sibling::table[2]');
    await expectTableRows(secondAdvisorTable, {
      'Accepted an application from a child or patient or someone on their behalf': 'No',
      'Provided legal help to a client who has already received it on the same matter within the last 6 months': 'No',
    });

    // As this case has no partner we should not see any `Your partner' column
    const partnerColumnHeaders = page.getByRole('table').getByRole('columnheader', { name: /Your partner/i });
    await expect(partnerColumnHeaders).toHaveCount(0);
  });

  test('should create a legal help form with partner sections', async ({ page }) => {
    const caseReference = 'PC-1869-9154'; // Partner case
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

    // Your details table
    await expectCaptionTableRows(page, 'Your details', {
      'Full name': 'Grace Baker',
      'Date of birth': '12 Nov 1979',
      'National Insurance number': 'AB123456C',
      'Current address': '544 King Street, Newcastle',
      'Postcode': 'LE1 1UL',
      'LAA reference': '2850581',
    });

     // Your finances table
    await expectCaptionTableRows(page, 'Your finances', {
      'Are you aged 17 or under?': 'No',
      'Do you have a partner?': 'Yes',
      'Are you or your partner aged 60 or over?': 'No',
    });

    // Benefits table
    await expectCaptionTableRows(page, 'Do you or your partner receive any of the following benefits:', {
      'Universal Credit': 'No',
      'Income Support': 'No',
      'Income-based Job Seekers Allowance': 'No',
      'Guarantee State Pension Credit': 'No',
      'Income-related Employment and Support Allowance': 'No',
    });

    // Property table
    await expectCaptionTableRows(page, 'Your property', { 'Do you or your partner own any property?': 'Yes' });

    // Property text
    await expect(page.getByText('We disregard up to £100,000 of the equity of your main home.')).toBeVisible();

    // Main property
    await expectPropertyTableRows(page, 'Main property', {
      'Property value': '£150,000',
      'Outstanding mortgage': '£60,000',
      'Percentage share': '100%',
    });

    // Total equity table
    await expectCaptionTableRows(page, 'Total equity', { 'Total equity in homes for assessment purposes': '£0' });

    // Capital table 
    await expectCapitalTableRows(page, {
      "Savings": '£100',
      "Investments": '£300',
      'Valuable Items': '£500',
      'Other capital': '£100',
      'Pensioner capital disregard': '£0',
      'Total capital for assessment purposes': '£2,000',
    });

    // Income table 
    const incomeHeading = page.getByRole('heading', { level: 2, name: 'Your income' });
    const incomeTable = incomeHeading.locator('xpath=following-sibling::table[1]');

    await expect(incomeHeading).toBeVisible();
    await expect(incomeTable.getByRole('columnheader', { name: 'You', exact: true })).toBeVisible();
    await expect(incomeTable.getByRole('columnheader', { name: 'Your partner', exact: true })).toBeVisible();

    // Income table
    await expectHeadingTableRows(page, 'Your income', {
      'Wages (before tax)': '£120',
      'Self employed drawings (before tax)': '£200',
      'Benefits': '£500',
      'Tax credits': '£100',
      'Child benefit (for household)': '£200',
      'Maintenance received': '£100',
      'Pension income': '£100',
      'Other income': '£0',
      'Total income': '£887.49',
    });

    await expectTableRows(incomeTable, {
      'Wages (before tax)': ['£120', '£130'],
      'Self employed drawings (before tax)': ['£200', '£100'],
      'Benefits': ['£500', '£500'],
      'Tax credits': ['£100', '£200'],
      'Child benefit (for household)': '£200',
      'Maintenance received': ['£100', '£200'],
      'Pension income': ['£100', '£200'],
      'Other income': ['£0', '£0'],
      'Total income': ['£887.49', '£887.49'],
    });

    // Less monthly allowances table
    await expectHeadingTableRows(page, 'Less monthly allowances', {
      'Tax': '£0',
      'National Insurance': '£0',
      'Mortgage': ['£350', '£300'],
      'Rent': ['£250', '£200'],
      'Maintenance payments being made': ['£20', '£40'],
      'Childcare costs due to work': ['£50', '£50'],
      'Legal Aid payments for criminal defence': ['£20', '£10'],
    });

    // Calculated expenses
    await expectHeadingTableRows(page, 'Calculated expenses', { 'Employment expenses': '£45' });

    const calculatedExpensesTable = page.getByRole('heading', { name: 'Calculated expenses' }).locator('xpath=following-sibling::table[1]');
    const totalTable = calculatedExpensesTable.locator('xpath=following-sibling::table[1]');
    await expectTableRows(totalTable, {
      'Dependants allowance': '£0',
      'Total monthly disposable income': '£0',
    });

    // Evidence can be seen in evidence box
    await expect(page.getByRole('heading', { name: 'Evidence we need from you' })).toBeVisible();
    await expect(page.locator('#more-detail')).toHaveValue(evidence);

    // One additional circumstance, shown on Legal Help Form
    await expectHeadingTableRows(page, 'For use by advisor', { 'Is this an application for exceptional case funding (ECF)?': 'Yes' });

    // Other advisor circumstances remain unselected
    const advisorHeading = page.getByRole('heading', { name: 'For use by advisor' });
    const secondAdvisorTable = advisorHeading.locator('xpath=following-sibling::table[2]');
    await expectTableRows(secondAdvisorTable, {
      'Accepted an application from a child or patient or someone on their behalf': 'No',
      'Provided legal help to a client who has already received it on the same matter within the last 6 months': 'No',
    });


    // As this case has a partner we should not see any `Your partner' column
    const partnerColumnHeaders = page.getByRole('table').getByRole('columnheader', { name: /Your partner/i });
    await expect(partnerColumnHeaders).toHaveCount(4); // your capital, your income, less monthly allowances, calculated expenses. 
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

    test('single customer wording is used for questions when there is no partner', async ({ page }) => {
      const caseReference = 'PC-1922-1879';

      await navigateToLegalHelpForm(page, caseReference);

      // Your finances table
      await expectCaptionTableRows(page, 'Your finances', {
        'Are you aged 17 or under?': 'No',
        'Do you have a partner?': 'No',
        'Are you aged 60 or over?': 'No',
      });

      // Benefits table
      await expectCaptionTableRows(page, 'Do you receive any of the following benefits:', {
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
      const benefitsTable = page.getByRole('table', { name: 'Do you or your partner receive any of the following benefits:' });

      await expect(benefitsTable).toBeVisible();
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
      'Date of birth': 'Not provided',
    });
  });

  test.describe('Legal help form property details', () => {
    test.beforeEach(async ({ page }) => {
      await setupAuth(page);
    });

    test('should show "No" in answer field, when the client does not own any property', async ({ page }) => {
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

      await expectPropertyTableRows(page, 'Main property', { 'Is this property disputed?': 'No' });

      await expectPropertyTableRows(page, 'Additional property 1', { 'Is this property disputed?': 'Yes' });
    });

    test('should show disputed property question for family cases', async ({ page }) => {
      const caseReference = 'PC-1924-9560'; // family case

      await navigateToLegalHelpForm(page, caseReference);

      await expectPropertyTableRows(page, 'Main property', { 'Is this property disputed?': 'Yes' });
    });

    test('should display the main property details and total equity', async ({ page }) => {
      const caseReference = 'PC-9173-4826';

      await navigateToLegalHelpForm(page, caseReference);

      await expectCaptionTableRows(page, 'Your property', { 'Do you own any property?': 'Yes' });

      await expect(page.getByRole('heading', { name: 'Main property' })).toBeVisible();

      await expectPropertyTableRows(page, 'Main property', {
        'Property value': '£150,000',
        'Outstanding mortgage': '£60,000',
        'Percentage share': '100%',
      });

      await expectCaptionTableRows(page, 'Total equity', { 'Total equity in homes for assessment purposes': '£0' });
    });

    test('should display additional properties and total equity', async ({ page }) => {
      const caseReference = 'PC-1922-1879';

      await navigateToLegalHelpForm(page, caseReference);

      await expectPropertyTableRows(page, 'Main property', {
        'Property value': '£120,000',
        'Outstanding mortgage': '£60,000',
        'Percentage share': '100%',
      });

      await expectPropertyTableRows(page, 'Additional property 1', {
        'Property value': '£130,000',
        'Outstanding mortgage': '£50,000',
        'Percentage share': '100%',
      });

      await expectCaptionTableRows(page, 'Total equity', { 'Total equity in homes for assessment purposes': '£80,000' });
    });

    test('should show no property and zero total equity', async ({ page }) => {
      const caseReference = 'PC-1854-6521';

      await navigateToLegalHelpForm(page, caseReference);

      await expectCaptionTableRows(page, 'Your property', { 'Do you own any property?': 'No' });

      await expect(page.getByRole('heading', { name: 'Main property' })).toHaveCount(0);
      await expect(page.getByRole('heading', { name: 'Additional property' })).toHaveCount(0);
      await expect(page.getByRole('heading', { name: 'Total equity' })).toHaveCount(0);
    });
  });

  test.describe('Legal help form capital details', () => {
    test.beforeEach(async ({ page }) => {
      await setupAuth(page);
    });

    test('should display capital values for a single client', async ({ page }) => {
      const caseReference = 'PC-1922-1879';

      await navigateToLegalHelpForm(page, caseReference);

      await expectCapitalTableRows(page, {
        'Savings': '£200',
        'Investments': '£100',
        'Valuable Items': '£500',
        'Other capital': '£200',
        'Pensioner capital disregard': '£0',
        'Total capital for assessment purposes': '£1,000',
      });
    });

    test('should display partner capital column when client has a partner', async ({ page }) => {
      const caseReference = 'PC-1869-9154';

      await navigateToLegalHelpForm(page, caseReference);

      const capitalTable = page
        .getByRole('heading', { name: 'Your capital' })
        .locator('xpath=following-sibling::table[1]');

      await expect(capitalTable.getByRole('columnheader', { name: "Your capital" })).toBeVisible();
      await expect(capitalTable.getByRole('columnheader', { name: "Your partner's capital" })).toBeVisible();

      // your savings data
      await expect(capitalTable).toContainText('£100');
      await expect(capitalTable).toContainText('£300');
      await expect(capitalTable).toContainText('£500');
      await expect(capitalTable).toContainText('£100');

      // your partner's savings data
      await expect(capitalTable).toContainText('£200');
      await expect(capitalTable).toContainText('£100');
      await expect(capitalTable).toContainText('£500');
      await expect(capitalTable).toContainText('£200');

      // Pensioner disregard
      await expect(capitalTable.getByRole('row').filter({ hasText: 'Pensioner capital disregard' })).toContainText('£0');

      // total 
      await expect(capitalTable.getByRole('row').filter({ hasText: 'Total capital for assessment purposes' })).toContainText('£2,000');
    });

    test('should display disputed savings column for debt cases', async ({ page }) => {
      const caseReference = 'PC-1357-1212';

      await navigateToLegalHelpForm(page, caseReference);

      const capitalTable = page.getByRole('heading', { name: 'Your capital' }).locator('xpath=following-sibling::table[1]');

      await expect(capitalTable.getByRole('columnheader', { name: "Your capital" })).toBeVisible();
      await expect(capitalTable.getByRole('columnheader', { name: 'Subject matter of dispute' })).toBeVisible();

      // your savings data
      await expect(capitalTable).toContainText('£200');
      await expect(capitalTable).toContainText('£100');
      await expect(capitalTable).toContainText('£500');
      await expect(capitalTable).toContainText('£200');

      // your disputed savings data
      await expect(capitalTable).toContainText('£200');
      await expect(capitalTable).toContainText('£100');
      await expect(capitalTable).toContainText('£500');
      await expect(capitalTable).toContainText('£200');

      // Pensioner disregard
      await expect(capitalTable.getByRole('row').filter({ hasText: 'Pensioner capital disregard' })).toContainText('£0');

      // total 
      await expect(capitalTable.getByRole('row').filter({ hasText: 'Total capital for assessment purposes' })).toContainText('£1,000');
    });

    test('should display disputed savings column for family cases', async ({ page }) => {
      const caseReference = 'PC-1924-9560';

      await navigateToLegalHelpForm(page, caseReference);

      const capitalTable = page.getByRole('heading', { name: 'Your capital' }).locator('xpath=following-sibling::table[1]');

      await expect(capitalTable.getByRole('columnheader', { name: "Your capital" })).toBeVisible();
      await expect(capitalTable.getByRole('columnheader', { name: 'Subject matter of dispute' })).toBeVisible();

      // your savings data
      await expect(capitalTable).toContainText('£200');
      await expect(capitalTable).toContainText('£100');
      await expect(capitalTable).toContainText('£500');
      await expect(capitalTable).toContainText('£200');

      // your disputed savings data
      await expect(capitalTable).toContainText('£200');
      await expect(capitalTable).toContainText('£100');
      await expect(capitalTable).toContainText('£500');
      await expect(capitalTable).toContainText('£200');

      // Pensioner disregard
      await expect(capitalTable.getByRole('row').filter({ hasText: 'Pensioner capital disregard' })).toContainText('£0');

      // total 
      await expect(capitalTable.getByRole('row').filter({ hasText: 'Total capital for assessment purposes' })).toContainText('£1,000');
    });
  });

  test('should display the submitted evidence on the legal help form', async ({ page }) => {
    const caseReference = 'PC-9173-4826';
    const evidence = 'Bank statements for the last 3 months';

    const clientDetails = ClientDetailsPage.forCase(page, caseReference);

    // Start on the client details page.
    await clientDetails.navigate();

    await expect(page).toHaveURL(`/cases/${caseReference}/client-details`);

    // Navigate to the intermediate legal help form page.
    await page.getByRole('button', { name: 'Get legal help form' }).click();

    await expect(page).toHaveURL(`/cases/${caseReference}/get-legal-help-form`);

    // Enter the required evidence.
    const evidenceInput = page.getByLabel('What evidence do you require from the client? (optional)');

    await evidenceInput.fill(evidence);
    await expect(evidenceInput).toHaveValue(evidence);

    // Submit the intermediate form.
    await page.getByRole('button', { name: 'Create legal help form' }).click();

    await expect(page).toHaveURL(`/cases/${caseReference}/legal-help-form`);

    // Check that the evidence section is displayed.
    await expect(page.getByRole('heading', { name: 'Evidence we need from you' })).toBeVisible();

    // Check that the submitted evidence appears on the generated form.
    const submittedEvidence = page.locator('#more-detail');

    await expect(submittedEvidence).toBeVisible();
    await expect(submittedEvidence).toBeDisabled();
    await expect(submittedEvidence).toHaveValue(evidence);
  });

  test('Legal help form income section, with partner', async ({ page }) => {
    await navigateToLegalHelpForm(page, 'PC-1869-9154');

    const incomeHeading = page.getByRole('heading', { level: 2, name: 'Your income' });
    const incomeTable = incomeHeading.locator('xpath=following-sibling::table[1]');

    await expect(incomeHeading).toBeVisible();
    await expect(incomeTable.getByRole('columnheader', { name: 'You', exact: true })).toBeVisible();
    await expect(incomeTable.getByRole('columnheader', { name: 'Your partner', exact: true })).toBeVisible();

    await expectTableRows(incomeTable, {
      'Wages (before tax)': ['£120', '£130'],
      'Self employed drawings (before tax)': ['£200', '£100'],
      'Benefits': ['£500', '£500'],
      'Total income': ['£887.49', '£887.49'],
    });

    await expectHeadingTableRows(page, 'Less monthly allowances', {
      'Tax': '£0',
      'National Insurance': '£0',
      'Mortgage': ['£350', '£300'],
      'Rent': ['£250', '£200'],
      'Maintenance payments being made': ['£20', '£40'],
      'Childcare costs due to work': ['£50', '£50'],
      'Legal Aid payments for criminal defence': ['£20', '£10'],
    });

    await expectHeadingTableRows(page, 'Calculated expenses', { 'Employment expenses': '£0' });

    const calculatedExpensesTable = page.getByRole('heading', { name: 'Calculated expenses' }).locator('xpath=following-sibling::table[1]');
    const totalTable = calculatedExpensesTable.locator('xpath=following-sibling::table[1]');
    await expectTableRows(totalTable, {
      'Dependants allowance': '£0',
      'Partner allowance': '£0',
      'Total monthly disposable income': '£0',
    });
  });

  test('should open the print dialog when "Print this page" is clicked', async ({ page }) => {
    await navigateToLegalHelpForm(page, 'PC-9173-4826');

    await page.evaluate(() => {
      window.print = () => {
        document.body.dataset.printDialogOpened = 'true';
      };
    });

    // Click print button at top of the [age]
    await page.getByRole('button', { name: 'Print this page' }).first().click();

    await expect(page.locator('body')).toHaveAttribute(
      'data-print-dialog-opened',
      'true',
    );
  });

  test('should repopulate the interstitial when returning from the legal help form', async ({ page }) => {
    const caseReference = 'PC-9173-4826';
    const evidence = 'Bank statements for the last 3 months';
    const clientDetails = ClientDetailsPage.forCase(page, caseReference);

    await clientDetails.navigate();

    await page.getByRole('button', { name: 'Get legal help form' }).click();

    await expect(page).toHaveURL(`/cases/${caseReference}/get-legal-help-form`);

    const evidenceInput = page.getByLabel('What evidence do you require from the client? (optional)');

    const circumstanceCheckbox = page.getByLabel('This is an application for Exceptional Case Funding (ECF)');

    await evidenceInput.fill(evidence);
    await circumstanceCheckbox.check();

    await page.getByRole('button', { name: 'Create legal help form' }).click();

    await expect(page).toHaveURL(`/cases/${caseReference}/legal-help-form`);

    await page.getByRole('link', { name: 'Back', exact: true }).click();

    await expect(page).toHaveURL(`/cases/${caseReference}/get-legal-help-form`);

    await expect(evidenceInput).toHaveValue(evidence);
    await expect(circumstanceCheckbox).toBeChecked();
  });

   test('should show yes for asylum support when on_nass_benefits is true', async ({ page }) => {
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

    // Your details table
    await expectCaptionTableRows(page, 'Your details', {
      'Full name': 'Ian Phillips',
      'Date of birth': '19 Dec 1991',
      'National Insurance number': 'AB123456C',
      'Current address': '38 Oak Avenue, Sheffield',
      'Postcode': 'NE1 8DR',
      'LAA reference': '3767316',
    });

    // Your finances table
    await expectCaptionTableRows(page, 'Your finances', {
      'Are you aged 17 or under?': 'No',
      'Do you have a partner?': 'No',
      'Are you aged 60 or over?': 'No',
    });

    // Benefits table
    await expectCaptionTableRows(page, 'Do you receive any of the following benefits:', {
      'Universal Credit': 'No',
      'Income Support': 'No',
      'Income-based Job Seekers Allowance': 'No',
      'Guarantee State Pension Credit': 'No',
      'Income-related Employment and Support Allowance': 'No',
      'Are you on National Asylum Support Service benefits?': 'Yes',
    });
  });
});
