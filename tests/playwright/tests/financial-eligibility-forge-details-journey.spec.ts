import { test, expect } from '../fixtures/index.js';
import { setupAuth, assertCaseDetailsHeaderPresent } from '../utils/index.js';

test.describe('Financial Eligibility Forge Details Journey', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test.describe('Under 18 journey paths', () => {
    test('should navigate through under-18 YES path: under18 -> regularPayment -> partner -> over60 -> benefits -> check answers', async ({ page }) => {
      // Navigate to the journey start
      await page.goto('/cases/PC-1922-1879/financial-eligibility/change');

      // Assert case details header
      await assertCaseDetailsHeaderPresent(page, { withMenuButtons: false, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 July 2025", badgeTexts: ['Urgent', 'At risk of abuse', 'Third Party'] });

      // Under 18: Yes
      await expect(page.getByRole('heading', { name: 'Are you aged 17 or under?' })).toBeVisible();
      await page.getByRole('radio', { name: 'Yes' }).check();
      await page.getByRole('button', { name: 'Continue' }).click();

      // Under 18 regular payment: Yes
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/under-18-receives-regular-payment');
      await expect(page.getByRole('heading', { name: 'Do you receive any money on a regular basis?' })).toBeVisible();
      await page.getByRole('radio', { name: 'Yes' }).check();
      await page.getByRole('button', { name: 'Continue' }).click();

      // Partner: No
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/has-partner');
      await expect(page.getByRole('heading', { name: 'Do you have a partner?' })).toBeVisible();
      await page.getByRole('radio', { name: 'No' }).check();
      await page.getByRole('button', { name: 'Continue' }).click();

      // Over 60: No
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/60-or-over');
      await expect(page.getByRole('heading', { name: 'Are you aged over 60?' })).toBeVisible();
      await page.getByRole('radio', { name: 'No' }).check();
      await page.getByRole('button', { name: 'Continue' }).click();

      // Benefits
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/benefits');
      await expect(page.getByRole('heading', { name: 'Benefits' })).toBeVisible();
      await page.getByRole('group', { name: 'Universal Credit' }).getByLabel('Yes').check()
      await page.getByRole('group', { name: 'Income Support' }).getByLabel('Yes').check()
      await page.getByRole('group', { name: 'Income-based Job Seekers' }).getByLabel('Yes').check()
      await page.getByRole('group', { name: 'Guarantee State Pension Credit' }).getByLabel('No').check()
      await page.getByRole('group', { name: 'Income-related Employment and' }).getByLabel('No').check()    
      await page.getByRole('button', { name: 'Continue' }).click();

      // Properties: Continue
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/properties');
      await expect(page.getByRole('heading', { name: 'Properties' })).toBeVisible();
      await page.getByRole('button', { name: 'Continue' }).click();

      // Savings: Enter '0' and continue
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/your-savings');
      await expect(page.getByRole('heading', { name: 'Your savings' })).toBeVisible();

      await page.getByRole('spinbutton', { name: 'How much was in your bank' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Do you have any investments,' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Do you have any valuable' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Do you have any money owed to' }).fill('0');
      await page.getByRole('button', { name: 'Continue' }).click();

      // Disregards: Continue
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/disregards');
      await expect(page.getByRole('heading', { name: 'Disregards' })).toBeVisible();
      await page.getByRole('checkbox', { name: 'None' }).check();
      await page.getByRole('button', { name: 'Continue' }).click();

      // Income: Enter '0' for all fields and continue
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/your-income');
      await page.getByRole('group', { name: 'Are you self employed?' }).getByLabel('No').check();
      await page.getByRole('spinbutton', { name: 'What did you earn before tax?' }).fill('0');
      await page.getByRole('spinbutton', { name: 'How much tax do you pay?' }).fill('0');
      await page.getByRole('spinbutton', { name: 'How much National Insurance do you pay?' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Self employed drawings' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Benefits' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Tax credits' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Maintenance received' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Pension income' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Other income' }).fill('0');
      await page.getByRole('button', { name: 'Continue' }).click();

      // Dependants: Enter '0' and continue
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/dependants');
      await page.getByRole('spinbutton', { name: 'Do you have any dependants aged 16 and over?' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Do you have any dependants aged 15 and under?' }).fill('0');
      await page.getByRole('button', { name: 'Continue' }).click();

      // Expenses: Enter '0' and continue
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/your-expenses');
      await page.getByRole('spinbutton', { name: 'How much do you pay for your mortgage?' }).fill('0');
      await page.getByRole('spinbutton', { name: 'How much do you pay for rent?' }).fill('0');
      await page.getByRole('spinbutton', { name: 'How much maintenance have you paid during the last calendar month' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Do you have any childcare costs because of work or study?' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Are you currently paying towards legal aid for criminal defence?' }).fill('0');
      await page.getByRole('button', { name: 'Continue' }).click();

      // Check answers
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/check-answers');
      await expect(page.getByRole('heading', { name: 'Check your answers' })).toBeVisible();
      
      // Verify summary displays correct answers
      await expect(page.getByText('Are you aged 17 or under?')).toBeVisible();
      await expect(page.getByText('Yes').first()).toBeVisible();
      
      // Submit the form
      await page.getByRole('button', { name: 'Submit' }).click();

      // Should redirect back to financial eligibility tab
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/');
    });

    test('should navigate through under-18 NO to valuables path: under18 -> regularPayment NO -> valuables -> check answers', async ({ page }) => {
      await page.goto('/cases/PC-1922-1879/financial-eligibility/change');

      // Under 18: Yes
      await page.getByRole('radio', { name: 'Yes' }).check();
      await page.getByRole('button', { name: 'Continue' }).click();

      // Under 18 regular payment: No
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/under-18-receives-regular-payment');
      await page.getByRole('radio', { name: 'No' }).check();
      await page.getByRole('button', { name: 'Continue' }).click();

      // Under 18 valuables: No
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/under-18-has-valuables');
      await expect(page.getByRole('heading', { name: 'Do you have any savings,' })).toBeVisible();
      await page.getByRole('radio', { name: 'No' }).check();
      await page.getByRole('button', { name: 'Continue' }).click();

      // Should skip to check answers as passported (bypassing partner and over60)
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/check-answers');
      await expect(page.getByRole('heading', { name: 'Check your answers' })).toBeVisible();
    });

    test('should navigate from under-18 NO directly to partner step', async ({ page }) => {
      await page.goto('/cases/PC-1922-1879/financial-eligibility/change');

      // Under 18: No
      await page.getByRole('radio', { name: 'No' }).check();
      await page.getByRole('button', { name: 'Continue' }).click();

      // Should go directly to partner question
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/has-partner');
      await expect(page.getByRole('heading', { name: 'Do you have a partner?' })).toBeVisible();
    });
  });

  test.describe('Partner routing paths', () => {
    test('should route to over60-with-partner when partner is YES', async ({ page }) => {
      await page.goto('/cases/PC-1922-1879/financial-eligibility/change');

      // Under 18: No
      await page.getByRole('radio', { name: 'No' }).check();
      await page.getByRole('button', { name: 'Continue' }).click();

      // Partner: Yes
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/has-partner');
      await page.getByRole('radio', { name: 'Yes' }).check();
      await page.getByRole('button', { name: 'Continue' }).click();

      // Should go to over60-with-partner version
      await expect(page).toHaveURL(/\/60-or-over-with-partner/);
      await expect(page.getByRole('heading', { name: 'Are you or your partner aged 60 or over?' })).toBeVisible();
    });

    test('should route to over60 without partner when partner is NO', async ({ page }) => {
      await page.goto('/cases/PC-1922-1879/financial-eligibility/change');

      // Under 18: No
      await page.getByRole('radio', { name: 'No' }).check();
      await page.getByRole('button', { name: 'Continue' }).click();

      // Partner: No
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/has-partner');
      await page.getByRole('radio', { name: 'No' }).check();
      await page.getByRole('button', { name: 'Continue' }).click();

      // Should go to regular over60 step (without partner)
      await expect(page).toHaveURL(/\/60-or-over$/);
      await expect(page.getByRole('heading', { name: 'Are you aged over 60?' })).toBeVisible();
    });
  });

  test.describe('Benefits step', () => {
    test('should allow multiple benefits to be selected', async ({ page }) => {
      await page.goto('/cases/PC-1922-1879/financial-eligibility/change');

      // Navigate to benefits step
      await page.getByRole('radio', { name: 'No' }).check(); // Under 18 = No
      await page.getByRole('button', { name: 'Continue' }).click();

      await page.getByRole('radio', { name: 'No' }).check(); // Partner = No
      await page.getByRole('button', { name: 'Continue' }).click();

      await page.getByRole('radio', { name: 'Yes' }).check(); // Over 60 = Yes
      await page.getByRole('button', { name: 'Continue' }).click();

      // Benefits step - select multiple benefits
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/benefits');
      await page.getByRole('group', { name: 'Universal Credit' }).getByLabel('Yes').check()
      await page.getByRole('group', { name: 'Income Support' }).getByLabel('Yes').check()
      await page.getByRole('group', { name: 'Income-based Job Seekers' }).getByLabel('Yes').check()
      await page.getByRole('group', { name: 'Guarantee State Pension Credit' }).getByLabel('No').check()
      await page.getByRole('group', { name: 'Income-related Employment and' }).getByLabel('No').check()      
      await page.getByRole('button', { name: 'Continue' }).click();

      // Properties: Continue
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/properties');
      await expect(page.getByRole('heading', { name: 'Properties' })).toBeVisible();
      await page.getByRole('button', { name: 'Continue' }).click();

      // Savings: Enter '0' and continue
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/your-savings');
      await expect(page.getByRole('heading', { name: 'Your savings' })).toBeVisible();

      await page.getByRole('spinbutton', { name: 'How much was in your bank' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Do you have any investments,' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Do you have any valuable' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Do you have any money owed to' }).fill('0');
      await page.getByRole('button', { name: 'Continue' }).click();

      // Disregards: Continue
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/disregards');
      await expect(page.getByRole('heading', { name: 'Disregards' })).toBeVisible();
      await page.getByRole('checkbox', { name: 'None' }).check();
      await page.getByRole('button', { name: 'Continue' }).click();

      // Income: Enter '0' for all fields and continue
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/your-income');
      await page.getByRole('group', { name: 'Are you self employed?' }).getByLabel('No').check();
      await page.getByRole('spinbutton', { name: 'What did you earn before tax?' }).fill('0');
      await page.getByRole('spinbutton', { name: 'How much tax do you pay?' }).fill('0');
      await page.getByRole('spinbutton', { name: 'How much National Insurance do you pay?' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Self employed drawings' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Benefits' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Tax credits' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Maintenance received' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Pension income' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Other income' }).fill('0');
      await page.getByRole('button', { name: 'Continue' }).click();

      // Dependants: Enter '0' and continue
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/dependants');
      await page.getByRole('spinbutton', { name: 'Do you have any dependants aged 16 and over?' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Do you have any dependants aged 15 and under?' }).fill('0');
      await page.getByRole('button', { name: 'Continue' }).click();

      // Expenses: Enter '0' and continue
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/your-expenses');
      await page.getByRole('spinbutton', { name: 'How much do you pay for your mortgage?' }).fill('0');
      await page.getByRole('spinbutton', { name: 'How much do you pay for rent?' }).fill('0');
      await page.getByRole('spinbutton', { name: 'How much maintenance have you paid during the last calendar month' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Do you have any childcare costs because of work or study?' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Are you currently paying towards legal aid for criminal defence?' }).fill('0');
      await page.getByRole('button', { name: 'Continue' }).click();

      // Verify we reach check answers
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/check-answers');
    });
  });

  test.describe('Check answers and submission', () => {
    test('should display all answers in check answers page and submit successfully', async ({ page }) => {
      await page.goto('/cases/PC-1922-1879/financial-eligibility/change');

      // Complete the journey with specific answers
      await page.getByRole('radio', { name: 'No' }).check(); // Under 18 = No
      await page.getByRole('button', { name: 'Continue' }).click();

      await page.getByRole('radio', { name: 'No' }).check(); // Partner = No
      await page.getByRole('button', { name: 'Continue' }).click();

      await page.getByRole('radio', { name: 'Yes' }).check(); // Over 60 = Yes
      await page.getByRole('button', { name: 'Continue' }).click();

      await page.getByRole('group', { name: 'Universal Credit' }).getByLabel('Yes').check()
      await page.getByRole('group', { name: 'Income Support' }).getByLabel('Yes').check()
      await page.getByRole('group', { name: 'Income-based Job Seekers' }).getByLabel('Yes').check()
      await page.getByRole('group', { name: 'Guarantee State Pension Credit' }).getByLabel('No').check()
      await page.getByRole('group', { name: 'Income-related Employment and' }).getByLabel('No').check()    
      await page.getByRole('button', { name: 'Continue' }).click();

      // Properties: Continue
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/properties');
      await expect(page.getByRole('heading', { name: 'Properties' })).toBeVisible();
      await page.getByRole('button', { name: 'Continue' }).click();

      // Savings: Enter '0' and continue
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/your-savings');
      await expect(page.getByRole('heading', { name: 'Your savings' })).toBeVisible();
      await page.getByRole('spinbutton', { name: 'How much was in your bank' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Do you have any investments,' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Do you have any valuable' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Do you have any money owed to' }).fill('0');
      await page.getByRole('button', { name: 'Continue' }).click();

      // Disregards: Continue
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/disregards');
      await expect(page.getByRole('heading', { name: 'Disregards' })).toBeVisible();
      await page.getByRole('checkbox', { name: 'None' }).check();
      await page.getByRole('button', { name: 'Continue' }).click();

      // Income: Enter '0' for all fields and continue
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/your-income');
      await page.getByRole('group', { name: 'Are you self employed?' }).getByLabel('No').check();
      await page.getByRole('spinbutton', { name: 'What did you earn before tax?' }).fill('0');
      await page.getByRole('spinbutton', { name: 'How much tax do you pay?' }).fill('0');
      await page.getByRole('spinbutton', { name: 'How much National Insurance do you pay?' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Self employed drawings' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Benefits' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Tax credits' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Maintenance received' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Pension income' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Other income' }).fill('0');
      await page.getByRole('button', { name: 'Continue' }).click();

      // Dependants: Enter '0' and continue
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/dependants');
      await page.getByRole('spinbutton', { name: 'Do you have any dependants aged 16 and over?' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Do you have any dependants aged 15 and under?' }).fill('0');
      await page.getByRole('button', { name: 'Continue' }).click();

      // Expenses: Enter '0' and continue
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/your-expenses');
      await page.getByRole('spinbutton', { name: 'How much do you pay for your mortgage?' }).fill('0');
      await page.getByRole('spinbutton', { name: 'How much do you pay for rent?' }).fill('0');
      await page.getByRole('spinbutton', { name: 'How much maintenance have you paid during the last calendar month' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Do you have any childcare costs because of work or study?' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Are you currently paying towards legal aid for criminal defence?' }).fill('0');
      await page.getByRole('button', { name: 'Continue' }).click();

      // Check answers page
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/check-answers');
      
      // Verify summary sections are present
      await expect(page.getByRole('heading', { name: 'About you' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Benefits' })).toBeVisible();

      // Submit the form
      await page.getByRole('button', { name: 'Submit' }).click();

      // Should redirect to financial eligibility tab
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/');
      await expect(page).not.toHaveURL('/cases/PC-1922-1879/financial-eligibility/change');
    });

    test('should allow changing answers from check answers page', async ({ page }) => {
      await page.goto('/cases/PC-1922-1879/financial-eligibility/change');

      // Complete journey to reach check answers
      await page.getByRole('radio', { name: 'No' }).check();
      await page.getByRole('button', { name: 'Continue' }).click();

      await page.getByRole('radio', { name: 'No' }).check();
      await page.getByRole('button', { name: 'Continue' }).click();

      await page.getByRole('radio', { name: 'No' }).check();
      await page.getByRole('button', { name: 'Continue' }).click();

      await page.getByRole('group', { name: 'Universal Credit' }).getByLabel('Yes').check()
      await page.getByRole('group', { name: 'Income Support' }).getByLabel('Yes').check()
      await page.getByRole('group', { name: 'Income-based Job Seekers' }).getByLabel('Yes').check()
      await page.getByRole('group', { name: 'Guarantee State Pension Credit' }).getByLabel('No').check()
      await page.getByRole('group', { name: 'Income-related Employment and' }).getByLabel('No').check()    
      await page.getByRole('button', { name: 'Continue' }).click();

      // Properties: Continue
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/properties');
      await expect(page.getByRole('heading', { name: 'Properties' })).toBeVisible();
      await page.getByRole('button', { name: 'Continue' }).click();

      // Savings: Enter '0' and continue
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/your-savings');
      await expect(page.getByRole('heading', { name: 'Your savings' })).toBeVisible();

      await page.getByRole('spinbutton', { name: 'How much was in your bank' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Do you have any investments,' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Do you have any valuable' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Do you have any money owed to' }).fill('0');
      await page.getByRole('button', { name: 'Continue' }).click();

      // Disregards: Continue
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/disregards');
      await expect(page.getByRole('heading', { name: 'Disregards' })).toBeVisible();
      await page.getByRole('checkbox', { name: 'None' }).check();
      await page.getByRole('button', { name: 'Continue' }).click();

      // Income: Enter '0' for all fields and continue
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/your-income');
      await page.getByRole('group', { name: 'Are you self employed?' }).getByLabel('No').check();
      await page.getByRole('spinbutton', { name: 'What did you earn before tax?' }).fill('0');
      await page.getByRole('spinbutton', { name: 'How much tax do you pay?' }).fill('0');
      await page.getByRole('spinbutton', { name: 'How much National Insurance do you pay?' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Self employed drawings' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Benefits' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Tax credits' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Maintenance received' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Pension income' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Other income' }).fill('0');
      await page.getByRole('button', { name: 'Continue' }).click();

      // Dependants: Enter '0' and continue
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/dependants');
      await page.getByRole('spinbutton', { name: 'Do you have any dependants aged 16 and over?' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Do you have any dependants aged 15 and under?' }).fill('0');
      await page.getByRole('button', { name: 'Continue' }).click();

      // Expenses: Enter '0' and continue
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/your-expenses');
      await page.getByRole('spinbutton', { name: 'How much do you pay for your mortgage?' }).fill('0');
      await page.getByRole('spinbutton', { name: 'How much do you pay for rent?' }).fill('0');
      await page.getByRole('spinbutton', { name: 'How much maintenance have you paid during the last calendar month' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Do you have any childcare costs because of work or study?' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Are you currently paying towards legal aid for criminal defence?' }).fill('0');
      await page.getByRole('button', { name: 'Continue' }).click();

      // At check answers page
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/check-answers');

      // Click a change link
      const changeLink = page.getByRole('link', { name: 'Change' }).first();
      await changeLink.click();
      
      // Should navigate back to a previous step
      await expect(page).not.toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/check-answers');
      
      // Make a change and continue
      await page.getByRole('radio').first().check();
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    test('should not show valuables row on check answers when `under-18` is `no`', async ({ page }) => {
      await page.goto('/cases/PC-1922-1879/financial-eligibility/change');

      // Under 18: No — skips regular payment and valuables questions entirely
      await page.getByRole('radio', { name: 'No' }).check();
      await page.getByRole('button', { name: 'Continue' }).click();

      // Partner: No
      await page.getByRole('radio', { name: 'No' }).check(); 
      await page.getByRole('button', { name: 'Continue' }).click();

      // Over 60: No
      await page.getByRole('radio', { name: 'No' }).check(); 
      await page.getByRole('button', { name: 'Continue' }).click();

      // Benefits step - select multiple benefits
      await page.getByRole('group', { name: 'Universal Credit' }).getByLabel('No').check();
      await page.getByRole('group', { name: 'Income Support' }).getByLabel('No').check();
      await page.getByRole('group', { name: 'Income-based Job Seekers' }).getByLabel('No').check();
      await page.getByRole('group', { name: 'Guarantee State Pension Credit' }).getByLabel('No').check();
      await page.getByRole('group', { name: 'Income-related Employment and' }).getByLabel('No').check();
      await page.getByRole('button', { name: 'Continue' }).click();

      // Properties: Continue
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/properties');
      await page.getByRole('button', { name: 'Continue' }).click();

      // Savings: Enter '0' and continue
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/your-savings');
      await page.getByRole('spinbutton', { name: 'How much was in your bank' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Do you have any investments,' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Do you have any valuable' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Do you have any money owed to' }).fill('0');
      await page.getByRole('button', { name: 'Continue' }).click();
      
      // Disregards: None & Continue
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/disregards');
      await page.getByRole('checkbox', { name: 'None' }).check();
      await page.getByRole('button', { name: 'Continue' }).click();

      // Income: Enter '0' for all fields and continue
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/your-income');
      await page.getByRole('group', { name: 'Are you self employed?' }).getByLabel('No').check();
      await page.getByRole('spinbutton', { name: 'What did you earn before tax?' }).fill('0');
      await page.getByRole('spinbutton', { name: 'How much tax do you pay?' }).fill('0');
      await page.getByRole('spinbutton', { name: 'How much National Insurance do you pay?' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Self employed drawings' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Benefits' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Tax credits' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Maintenance received' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Pension income' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Other income' }).fill('0');
      await page.getByRole('button', { name: 'Continue' }).click();

      // Dependants: Enter '0' and continue
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/dependants');
      await page.getByRole('spinbutton', { name: 'Do you have any dependants aged 16 and over?' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Do you have any dependants aged 15 and under?' }).fill('0');
      await page.getByRole('button', { name: 'Continue' }).click();

      // Expenses: Enter '0' and continue
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/your-expenses');
      await page.getByRole('spinbutton', { name: 'How much do you pay for your mortgage?' }).fill('0');
      await page.getByRole('spinbutton', { name: 'How much do you pay for rent?' }).fill('0');
      await page.getByRole('spinbutton', { name: 'How much maintenance have you paid during the last calendar month' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Do you have any childcare costs because of work or study?' }).fill('0');
      await page.getByRole('spinbutton', { name: 'Are you currently paying towards legal aid for criminal defence?' }).fill('0');
      await page.getByRole('button', { name: 'Continue' }).click();

      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/check-answers');

      await expect(page.getByText('Do you have any savings, items of value or investments totalling £2500 or more?')).not.toBeVisible();
    });
  });
});
