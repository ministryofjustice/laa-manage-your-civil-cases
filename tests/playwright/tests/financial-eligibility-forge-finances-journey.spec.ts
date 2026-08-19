import { test, expect } from '../fixtures/index.js';
import type { Page } from '@playwright/test';
import { setupAuth, assertCaseDetailsHeaderPresent } from '../utils/index.js';

async function completeIntroToBenefitsNoPartner(page: Page) {
  await page.goto(`/cases/PC-1922-1879/financial-eligibility/change`);
  await assertCaseDetailsHeaderPresent(page, { withMenuButtons: false, expectedName: 'Jack Youngs', expectedCaseRef: 'PC-1922-1879', dateReceived: '7 July 2025', badgeTexts: ['Urgent', 'At risk of abuse', 'Third Party'] });

  // Under 18: No
  await page.getByRole('radio', { name: 'No' }).check();
  await page.getByRole('button', { name: 'Continue' }).click();

  // Partner: No
  await expect(page).toHaveURL(`/cases/PC-1922-1879/financial-eligibility/change/has-partner`);
  await page.getByRole('radio', { name: 'No' }).check();
  await page.getByRole('button', { name: 'Continue' }).click();

  // Over 60: No
  await expect(page).toHaveURL(`/cases/PC-1922-1879/financial-eligibility/change/60-or-over`);
  await page.getByRole('radio', { name: 'No' }).check();
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page).toHaveURL(`/cases/PC-1922-1879/financial-eligibility/change/benefits`);
}

async function completeIntroToBenefitsWithPartner(page: Page) {
  await page.goto(`/cases/PC-1922-1879/financial-eligibility/change`);

  // Under 18: No
  await page.getByRole('radio', { name: 'No' }).check();
  await page.getByRole('button', { name: 'Continue' }).click();

  // Partner: Yes
  await expect(page).toHaveURL(`/cases/PC-1922-1879/financial-eligibility/change/has-partner`);
  await page.getByRole('radio', { name: 'Yes' }).check();
  await page.getByRole('button', { name: 'Continue' }).click();

  // Over 60: No
  await expect(page).toHaveURL(`/cases/PC-1922-1879/financial-eligibility/change/60-or-over-with-partner`);
  await page.getByRole('radio', { name: 'No' }).check();
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page).toHaveURL(`/cases/PC-1922-1879/financial-eligibility/change/benefits`);
}

async function completeBenefits(page: Page) {
  // Benefits: no passporting benefits, so the journey continues through income/expenses
  await page.getByRole('group', { name: 'Universal Credit' }).getByLabel('No').check();
  await page.getByRole('group', { name: 'Income Support' }).getByLabel('No').check();
  await page.getByRole('group', { name: 'Income-based Job Seekers' }).getByLabel('No').check();
  await page.getByRole('group', { name: 'Guarantee State Pension Credit' }).getByLabel('No').check();
  await page.getByRole('group', { name: 'Income-related Employment and' }).getByLabel('No').check();
  await page.getByRole('button', { name: 'Continue' }).click();
}

async function completeSavingsValues(page: Page) {
  // Savings: Enter '0' and continue
  await page.getByRole('spinbutton', { name: 'How much was in your bank' }).fill('0');
  await page.getByRole('spinbutton', { name: 'Do you have any investments,' }).fill('0');
  await page.getByRole('spinbutton', { name: 'Do you have any valuable' }).fill('0');
  await page.getByRole('spinbutton', { name: 'Do you have any money owed to' }).fill('0');
  await page.getByRole('button', { name: 'Continue' }).click();
}

async function completePartnerSavingsValues(page: Page) {
  // Partner savings: Enter '0' and continue
  await page.getByRole('spinbutton', { name: 'How much was in your partner\'' }).fill('0');
  await page.getByRole('spinbutton', { name: 'Does your partner have any investments, shares or ISAs?' }).fill('0');
  await page.getByRole('spinbutton', { name: 'Does your partner have any valuable items worth over £500 each?' }).fill('0');
  await page.getByRole('spinbutton', { name: 'Does your partner have any money owed to them?' }).fill('0');
  await page.getByRole('button', { name: 'Continue' }).click();
}

async function completeDisputedSavingsValues(page: Page) {
  // Disputed savings: Enter '0' and continue
  await page.getByRole('spinbutton', { name: 'How much was in your bank' }).fill('0');
  await page.getByRole('spinbutton', { name: 'Do you have any investments,' }).fill('0');
  await page.getByRole('spinbutton', { name: 'Do you have any valuable' }).fill('0');
  await page.getByRole('spinbutton', { name: 'Do you have any money owed to' }).fill('0');
  await page.getByRole('button', { name: 'Continue' }).click();
}

async function reachSavingsNoPartner(page: Page) {
  await completeIntroToBenefitsNoPartner(page);
  await completeBenefits(page);

  await expect(page).toHaveURL(`/cases/PC-1922-1879/financial-eligibility/change/properties`);
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page).toHaveURL(`/cases/PC-1922-1879/financial-eligibility/change/your-savings`);
}

async function reachSavingsWithPartner(page: Page) {
  await completeIntroToBenefitsWithPartner(page);
  await completeBenefits(page);

  await expect(page).toHaveURL(`/cases/PC-1922-1879/financial-eligibility/change/client-partner-properties`);
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page).toHaveURL(`/cases/PC-1922-1879/financial-eligibility/change/your-savings`);
}

async function completeDisregardsNone(page: Page) {
  await page.getByRole('checkbox', { name: 'None' }).check();
  await page.getByRole('button', { name: 'Continue' }).click();
}

async function completeIncomeValues(page: Page) {
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
}

async function completePartnerIncomeValues(page: Page) {
  await page.getByRole('group', { name: 'Is your partner self employed?' }).getByLabel('No').check();
  await page.getByRole('spinbutton', { name: 'What did your partner earn before tax?' }).fill('0');
  await page.getByRole('spinbutton', { name: 'How much tax does your partner pay?' }).fill('0');
  await page.getByRole('spinbutton', { name: 'How much National Insurance does your partner pay?' }).fill('0');
  await page.getByRole('spinbutton', { name: 'Self employed drawings' }).fill('0');
  await page.getByRole('spinbutton', { name: 'Benefits' }).fill('0');
  await page.getByRole('spinbutton', { name: 'Tax credits' }).fill('0');
  await page.getByRole('spinbutton', { name: 'Maintenance received' }).fill('0');
  await page.getByRole('spinbutton', { name: 'Pension income' }).fill('0');
  await page.getByRole('spinbutton', { name: 'Other income' }).fill('0');
  await page.getByRole('button', { name: 'Continue' }).click();
}

async function completeDependantsValues(page: Page) {
  await page.getByRole('spinbutton', { name: 'Do you have any dependants aged 16 and over?' }).fill('0');
  await page.getByRole('spinbutton', { name: 'Do you have any dependants aged 15 and under?' }).fill('0');
  await page.getByRole('button', { name: 'Continue' }).click();
}

async function completePartnerDependantsValues(page: Page) {
  await page.getByRole('spinbutton', { name: 'Do you and your partner have any dependants aged 16 and over?' }).fill('0');
  await page.getByRole('spinbutton', { name: 'Do you and your partner have any dependants aged 15 and under?' }).fill('0');
  await page.getByRole('button', { name: 'Continue' }).click();
}

async function completeExpensesValues(page: Page) {
  await page.getByRole('spinbutton', { name: 'How much do you pay for your mortgage?' }).fill('0');
  await page.getByRole('spinbutton', { name: 'How much do you pay for rent?' }).fill('0');
  await page.getByRole('spinbutton', { name: 'How much maintenance have you paid during the last calendar month' }).fill('0');
  await page.getByRole('spinbutton', { name: 'Do you have any childcare costs because of work or study?' }).fill('0');
  await page.getByRole('spinbutton', { name: 'Are you currently paying towards legal aid for criminal defence?' }).fill('0');
  await page.getByRole('button', { name: 'Continue' }).click();
}

async function completePartnerExpensesValues(page: Page) {
  await page.getByRole('spinbutton', { name: 'How much does your partner pay for their mortgage?' }).fill('0');
  await page.getByRole('spinbutton', { name: 'How much does your partner pay for their rent?' }).fill('0');
  await page.getByRole('spinbutton', { name: 'How much maintenance has your partner paid during the last calendar month' }).fill('0');
  await page.getByRole('spinbutton', { name: 'Does your partner have any childcare costs because of work or study?' }).fill('0');
  await page.getByRole('spinbutton', { name: 'Is your partner currently paying towards legal aid for criminal defence?' }).fill('0');
  await page.getByRole('button', { name: 'Continue' }).click();
}

async function reachIncomeNoPartner(page: Page) {
  await reachSavingsNoPartner(page);
  await completeSavingsValues(page);

  await expect(page).toHaveURL(`/cases/PC-1922-1879/financial-eligibility/change/disregards`);
  await completeDisregardsNone(page);

  await expect(page).toHaveURL(`/cases/PC-1922-1879/financial-eligibility/change/your-income`);
}

async function reachIncomeWithPartner(page: Page) {
  await reachSavingsWithPartner(page);
  await completeSavingsValues(page);

  await expect(page).toHaveURL(`/cases/PC-1922-1879/financial-eligibility/change/partner-savings`);
  await completePartnerSavingsValues(page);

  await expect(page).toHaveURL(`/cases/PC-1922-1879/financial-eligibility/change/disregards`);
  await completeDisregardsNone(page);

  await expect(page).toHaveURL(`/cases/PC-1922-1879/financial-eligibility/change/your-income`);
}

async function reachExpensesNoPartner(page: Page) {
  await reachIncomeNoPartner(page);
  await completeIncomeValues(page);

  await expect(page).toHaveURL(`/cases/PC-1922-1879/financial-eligibility/change/dependants`);
  await completeDependantsValues(page);

  await expect(page).toHaveURL(`/cases/PC-1922-1879/financial-eligibility/change/your-expenses`);
}

test.describe('Financial Eligibility Forge Finances Journey', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test.describe('Properties routing paths', () => {
    test('should route from properties to savings', async ({ page }) => {
      await completeIntroToBenefitsNoPartner(page);
      await completeBenefits(page);

      await expect(page).toHaveURL(`/cases/PC-1922-1879/financial-eligibility/change/properties`);
      await expect(page.getByRole('heading', { name: 'Properties' })).toBeVisible();
      await page.getByRole('button', { name: 'Continue' }).click();

      await expect(page).toHaveURL(`/cases/PC-1922-1879/financial-eligibility/change/your-savings`);
    });

  });

  test.describe('Properties validation', () => {
    test('should show required field errors when a new empty property is submitted', async ({ page }) => {
      await page.goto('/cases/PC-1854-6521/financial-eligibility/change/properties'); // Walter White has no properties in mock data

      await page.getByRole('button', { name: 'Add property' }).click();
      await page.getByRole('button', { name: 'Continue' }).click();

      await expect(page.getByRole('link', { name: 'Enter the current market' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Enter how much is left to pay' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Select yes if property 1 is' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Enter the percentage you own' })).toBeVisible();
    });

    test('should show partner property question when applicant has a partner', async ({ page }) => {
      await page.goto('/cases/PC-1869-9154/financial-eligibility/change/client-partner-properties'); // Grace Baker has a partner and property data
      await expect(page.getByRole('heading', { name: 'Properties' })).toBeVisible();
      await expect(page.getByLabel('What is the current market value of the property?')).toBeVisible();
      await expect(page.getByLabel('How much is left to pay on the mortgage?')).toBeVisible();
      await expect(page.getByText('Is this your main property?')).toBeVisible();
      await expect(page.getByLabel('What percentage of the property do you and/or your partner own?')).toBeVisible();
    });

    test('should not show partner property question when applicant does not have a partner', async ({ page }) => {
      await page.goto('/cases/PC-1924-9560/financial-eligibility/change/properties'); // Lisa NO NOTES Chen has no partner and property data
      await expect(page.getByRole('heading', { name: 'Properties' })).toBeVisible();
      await expect(page.getByLabel('What is the current market value of the property?')).toBeVisible();
      await expect(page.getByLabel('How much is left to pay on the mortgage?')).toBeVisible();
      await expect(page.getByText('Is this your main property?')).toBeVisible();
      await expect(page.getByLabel('What percentage of the property do you own?')).toBeVisible();
    });

    test('should show validation error when property value is negative', async ({ page }) => {
      await page.goto('/cases/PC-1854-6521/financial-eligibility/change/properties'); // Walter White has no properties in mock data
      await page.getByRole('button', { name: 'Add property' }).click();
      await page.getByRole('button', { name: 'Continue' }).click();
      await page.getByRole('spinbutton', { name: 'What is the current market value of the property?' }).first().fill('-1');
      await page.getByRole('button', { name: 'Continue' }).click();

      await expect(page.getByRole('listitem').filter({ hasText: 'The current market value of' })).toBeVisible();
    });

    test('should show validation error when property share percentage exceeds 100', async ({ page }) => {
      await page.goto('/cases/PC-1854-6521/financial-eligibility/change/properties'); // Walter White has no properties in mock data
      await page.getByRole('button', { name: 'Add property' }).click();
      await page.getByRole('button', { name: 'Continue' }).click();
      await page.getByRole('spinbutton', { name: 'What percentage of the property do you own?' }).first().fill('101');
      await page.getByRole('button', { name: 'Continue' }).click();

      await expect(page.getByRole('link', { name: 'The percentage you own of' })).toBeVisible();
    });

    test('should show validation error when property share percentage has decimals', async ({ page }) => {
      await page.goto('/cases/PC-1854-6521/financial-eligibility/change/properties'); // Walter White has no properties in mock data
      await page.getByRole('button', { name: 'Add property' }).click();

      await page.getByRole('spinbutton', { name: 'What is the current market value of the property?' }).first().fill('100000');
      await page.getByRole('spinbutton', { name: 'How much is left to pay on the mortgage?' }).first().fill('0');
      await page.getByRole('group', { name: 'Is this your main property?' }).first().getByLabel('Yes').check();
      await page.getByRole('spinbutton', { name: 'What percentage of the property do you own?' }).first().fill('50.5');
      await page.getByRole('button', { name: 'Continue' }).click();

      await expect(page.getByRole('link', { name: 'The percentage you own of property 1 must be a whole number' })).toBeVisible();
    });

    test('should show step-level error when more than one property is marked as main', async ({ page }) => {
      await page.goto('/cases/PC-1854-6521/financial-eligibility/change/properties'); // Walter White has no properties in mock data
      await page.getByRole('button', { name: 'Add property' }).click();
      await page.getByRole('button', { name: 'Continue' }).click();
      await page.getByRole('button', { name: 'Add another property' }).click();
      await page.getByRole('button', { name: 'Continue' }).click();
      await page.getByRole('group', { name: 'Is this your main property?' }).first().getByLabel('Yes').check();
      await page.getByRole('group', { name: 'Is this your main property?' }).nth(1).getByLabel('Yes').check();
      await page.getByRole('button', { name: 'Continue' }).click();

      await expect(page.getByText('Only one property can be your main property')).toBeVisible();
    });

    test('should show validation error for disputed field when unanswered on debt category', async ({ page }) => {
      await page.goto('/cases/PC-1357-1212/financial-eligibility/change/properties'); // "James Potter" in mock data is in the "debt" category, which shows disputed route
      await page.getByRole('button', { name: 'Add another property' }).click();
      await page.getByRole('button', { name: 'Continue' }).click();

      await page.getByRole('spinbutton', { name: 'What is the current market value of the property?' }).first().fill('100000');
      await page.getByRole('spinbutton', { name: 'How much is left to pay on the mortgage?' }).first().fill('0');
      await page.getByRole('group', { name: 'Is this your main property?' }).first().getByLabel('Yes').check();
      await page.getByRole('spinbutton', { name: 'What percentage of the property do you own?' }).first().fill('100');
      await page.getByRole('button', { name: 'Continue' }).click();

      await expect(page.getByRole('link', { name: 'Select yes if property 2 is disputed' })).toBeVisible();
    });
  });

  test.describe('"Your savings" routing paths', () => {
    test('should route savings to partner savings when partner is yes', async ({ page }) => {
      await reachSavingsWithPartner(page);
      await expect(page.getByRole('heading', { name: 'Your savings' })).toBeVisible();

      await completeSavingsValues(page);

      await expect(page).toHaveURL(`/cases/PC-1922-1879/financial-eligibility/change/partner-savings`);
      await expect(page.getByRole('heading', { name: 'Your partner\'s savings' })).toBeVisible();
    });

    test('should route savings directly to disregards when no partner and non-disputed category', async ({ page }) => {
      await reachSavingsNoPartner(page);
      await expect(page.getByRole('heading', { name: 'Your savings' })).toBeVisible();

      await completeSavingsValues(page);

      await expect(page).toHaveURL(`/cases/PC-1922-1879/financial-eligibility/change/disregards`);
      await expect(page.getByRole('heading', { name: 'Disregards' })).toBeVisible();
    });

  });
  test.describe('"Your savings" validation', () => {
    test('should show required field errors when all savings fields are empty', async ({ page }) => {
      await page.goto('/cases/PC-1922-1879/financial-eligibility/change/your-savings');

      await page.getByRole('spinbutton', { name: 'How much was in your bank' }).fill('');
      await page.getByRole('spinbutton', { name: 'Do you have any investments,' }).fill('');
      await page.getByRole('spinbutton', { name: 'Do you have any valuable' }).fill('');
      await page.getByRole('spinbutton', { name: 'Do you have any money owed to' }).fill('');
      await page.getByRole('button', { name: 'Continue' }).click();

      await expect(page.getByRole('link', { name: 'Enter how much was in your' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Enter the value of any investments, shares or ISAs you have, or enter \'0\' if' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Enter the value of any valuable items you have worth over £500 each, or enter \'' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Enter the amount of any money' })).toBeVisible();
    });

    test('should show validation error when a savings value is negative', async ({ page }) => {
      await page.goto('/cases/PC-1922-1879/financial-eligibility/change/your-savings');

      await page.getByRole('spinbutton', { name: 'How much was in your bank' }).fill('-1');
      await page.getByRole('button', { name: 'Continue' }).click();

      await expect(page.getByRole('link', { name: 'How much was in your bank' })).toBeVisible();
    });
  });
  test.describe('"Your partner\'s savings" routing paths', () => {
    test('should route partner savings to disregards for non-disputed category', async ({ page }) => {
      await reachSavingsWithPartner(page);
      await completeSavingsValues(page);

      await expect(page).toHaveURL(`/cases/PC-1922-1879/financial-eligibility/change/partner-savings`);
      await completePartnerSavingsValues(page);

      await expect(page).toHaveURL(`/cases/PC-1922-1879/financial-eligibility/change/disregards`);
    });

    test('should route partner savings to disputed savings for debt category', async ({ page }) => {
      await page.goto('/cases/PC-1357-1212/financial-eligibility/change'); // "James Potter" in mock data is in the "debt" category, which shows disputed route

      // Under 18: No
      await page.getByRole('radio', { name: 'No' }).check();
      await page.getByRole('button', { name: 'Continue' }).click();

      // Partner: No
      await expect(page).toHaveURL('/cases/PC-1357-1212/financial-eligibility/change/has-partner');
      await page.getByRole('radio', { name: 'Yes' }).check();
      await page.getByRole('button', { name: 'Continue' }).click();

      // Over 60: No
      await expect(page).toHaveURL('/cases/PC-1357-1212/financial-eligibility/change/60-or-over-with-partner');
      await page.getByRole('radio', { name: 'No' }).check();
      await page.getByRole('button', { name: 'Continue' }).click();

      // Benefits
      await expect(page).toHaveURL('/cases/PC-1357-1212/financial-eligibility/change/benefits');
      await completeBenefits(page);

      // Properties: None
      await expect(page).toHaveURL('/cases/PC-1357-1212/financial-eligibility/change/client-partner-properties');
      await page.getByRole('button', { name: 'Continue' }).click();

      // Savings: None
      await expect(page).toHaveURL('/cases/PC-1357-1212/financial-eligibility/change/your-undisputed-savings');
      await completeSavingsValues(page);

      // Partner Savings: None
      await expect(page).toHaveURL('/cases/PC-1357-1212/financial-eligibility/change/partner-undisputed-savings');
      await completePartnerSavingsValues(page);

      await expect(page).toHaveURL('/cases/PC-1357-1212/financial-eligibility/change/disputed-savings');
      await expect(page.getByRole('heading', { name: 'Your disputed savings' })).toBeVisible();
    });

  });

  test.describe('"Your partner\'s savings" validation', () => {
    test('should show required field errors when all partner savings fields are empty', async ({ page }) => {
      await page.goto('/cases/PC-1922-1879/financial-eligibility/change/partner-savings');

      await page.getByRole('spinbutton', { name: 'How much was in your partner\'' }).fill('');
      await page.getByRole('spinbutton', { name: 'Does your partner have any investments, shares or ISAs?' }).fill('');
      await page.getByRole('spinbutton', { name: 'Does your partner have any valuable items worth over £500 each?' }).fill('');
      await page.getByRole('spinbutton', { name: 'Does your partner have any money owed to them?' }).fill('');
      await page.getByRole('button', { name: 'Continue' }).click();

      await expect(page.getByRole('link', { name: 'Enter how much was in your' })).toBeVisible();
      await expect(page.getByRole('listitem').filter({ hasText: 'Enter the value of any investments, shares or ISAs your partner has, or enter \'' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Enter the value of any valuable items your partner has worth over £500 each, or' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Enter the amount of any money' })).toBeVisible();
    });

    test('should show validation error when a partner savings value is negative', async ({ page }) => {
      await page.goto('/cases/PC-1922-1879/financial-eligibility/change/partner-savings');

      await page.getByRole('spinbutton', { name: 'How much was in your partner\'' }).fill('-1');
      await page.getByRole('button', { name: 'Continue' }).click();

      await expect(page.getByRole('link', { name: 'How much was in your partner\'' })).toBeVisible();
    });
  });

  test.describe('"Your disputed savings" routing paths', () => {
    test('should route disputed savings to disregards', async ({ page }) => {
      await page.goto('/cases/PC-1357-1212/financial-eligibility/change/disputed-savings'); // "James Potter" in mock data is in the "debt" category, which shows disputed route

      await expect(page.getByRole('heading', { name: 'Your disputed savings' })).toBeVisible();
      await completeDisputedSavingsValues(page);

      await expect(page).toHaveURL('/cases/PC-1357-1212/financial-eligibility/change/disregards');
      await expect(page.getByRole('heading', { name: 'Disregards' })).toBeVisible();
    });

  });

  test.describe('"Your disputed savings" validation', () => {
    test('should show required field errors when all disputed savings fields are empty', async ({ page }) => {
      await page.goto('/cases/PC-1357-1212/financial-eligibility/change/disputed-savings');

      await page.getByRole('spinbutton', { name: 'How much was in your bank' }).fill('');
      await page.getByRole('spinbutton', { name: 'Do you have any investments,' }).fill('');
      await page.getByRole('spinbutton', { name: 'Do you have any valuable' }).fill('');
      await page.getByRole('spinbutton', { name: 'Do you have any money owed to' }).fill('');
      await page.getByRole('button', { name: 'Continue' }).click();

      await expect(page.getByRole('link', { name: 'Enter how much was in your' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Enter the value of any investments, shares or ISAs you have, or enter \'0\' if' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Enter the value of any valuable items you have worth over £500 each, or enter \'' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Enter the amount of any money' })).toBeVisible();
    });

    test('should show validation error when a disputed savings value is negative', async ({ page }) => {
      await page.goto('/cases/PC-1357-1212/financial-eligibility/change/disputed-savings');

      await page.getByRole('spinbutton', { name: 'How much was in your bank' }).fill('-1');
      await page.getByRole('button', { name: 'Continue' }).click();

      await expect(page.getByRole('link', { name: 'How much was in your bank' })).toBeVisible();
    });
  });

  test.describe('Disregards routing paths', () => {
    test('should route disregards to your income when none is selected', async ({ page }) => {
      await reachSavingsNoPartner(page);
      await completeSavingsValues(page);

      // Disregards: None
      await expect(page).toHaveURL(`/cases/PC-1922-1879/financial-eligibility/change/disregards`);
      await completeDisregardsNone(page);

      await expect(page).toHaveURL(`/cases/PC-1922-1879/financial-eligibility/change/your-income`);
      await expect(page.getByRole('heading', { name: 'Your income' })).toBeVisible();
    });

  });

  test.describe('Disregards validation', () => {
    test('should show required field error when no disregard checkbox is selected', async ({ page }) => {
      await page.goto('/cases/PC-1922-1879/financial-eligibility/change/disregards');

      for (const checkbox of await page.getByRole('checkbox').all()) {
        await checkbox.uncheck();
      }
      await page.getByRole('button', { name: 'Continue' }).click();

      await expect(page.getByRole('link', { name: 'Select all disregards that' })).toBeVisible();
    });
  });

  test.describe('"Your income" validation', () => {
    test('should show validation error when earnings is negative', async ({ page }) => {
      await reachIncomeNoPartner(page);

      await page.getByRole('group', { name: 'Are you self employed?' }).getByLabel('No').check();
      await page.getByRole('spinbutton', { name: 'What did you earn before tax?' }).fill('-1');
      await page.getByRole('button', { name: 'Continue' }).click();

      await expect(page.getByRole('link', { name: 'What you earned before tax must be a positive number' })).toBeVisible();
    });
  });

  test.describe('"Your income" routing paths', () => {
    test('should route income to dependants when no partner', async ({ page }) => {
      await reachIncomeNoPartner(page);
      await expect(page.getByRole('heading', { name: 'Your income' })).toBeVisible();

      await completeIncomeValues(page);

      await expect(page).toHaveURL(`/cases/PC-1922-1879/financial-eligibility/change/dependants`);
      await expect(page.getByRole('heading', { name: 'Dependants' })).toBeVisible();
    });

    test('should route income to partner income when partner is yes', async ({ page }) => {
      await reachIncomeWithPartner(page);

      await completeIncomeValues(page);

      await expect(page).toHaveURL(`/cases/PC-1922-1879/financial-eligibility/change/partner-income`);
      await expect(page.getByRole('heading', { name: 'Your partner\'s income' })).toBeVisible();
    });
  });

  test.describe('"Your partner\'s income" routing paths', () => {
    test('should route partner income to partner dependants', async ({ page }) => {
      await reachIncomeWithPartner(page);
      await completeIncomeValues(page);

      await expect(page).toHaveURL(`/cases/PC-1922-1879/financial-eligibility/change/partner-income`);
      await completePartnerIncomeValues(page);

      await expect(page).toHaveURL(`/cases/PC-1922-1879/financial-eligibility/change/partner-dependants`);
      await expect(page.getByRole('heading', { name: 'Dependants' })).toBeVisible();
    });
  });

  test.describe('Dependants routing paths', () => {
    test('should route dependants to your expenses', async ({ page }) => {
      await reachIncomeNoPartner(page);
      await completeIncomeValues(page);

      await expect(page).toHaveURL(`/cases/PC-1922-1879/financial-eligibility/change/dependants`);
      await completeDependantsValues(page);

      await expect(page).toHaveURL(`/cases/PC-1922-1879/financial-eligibility/change/your-expenses`);
      await expect(page.getByRole('heading', { name: 'Your expenses' })).toBeVisible();
    });
  });

  test.describe('Dependants validation', () => {
    test('should show validation error when a dependants value is not a whole number', async ({ page }) => {
      await reachIncomeNoPartner(page);
      await completeIncomeValues(page);

      await expect(page).toHaveURL(`/cases/PC-1922-1879/financial-eligibility/change/dependants`);
      await page.getByRole('spinbutton', { name: 'Do you have any dependants aged 16 and over?' }).fill('1.5');
      await page.getByRole('spinbutton', { name: 'Do you have any dependants aged 15 and under?' }).fill('0');
      await page.getByRole('button', { name: 'Continue' }).click();

      await expect(page.getByRole('link', { name: 'The number of dependants you have aged 16 and over must be a whole positive number' })).toBeVisible();
    });
  });

  test.describe('"Your expenses" validation', () => {
    test('should show validation error when mortgage value is negative', async ({ page }) => {
      await reachExpensesNoPartner(page);

      await page.getByRole('spinbutton', { name: 'How much do you pay for your mortgage?' }).fill('-1');
      await page.getByRole('button', { name: 'Continue' }).click();

      await expect(page.getByRole('link', { name: 'How much you pay for your mortgage must be a positive number' })).toBeVisible();
    });
  });

  test.describe('"Your expenses" routing paths', () => {
    test('should route expenses to check answers when no partner', async ({ page }) => {
      await reachExpensesNoPartner(page);
      await expect(page.getByRole('heading', { name: 'Your expenses' })).toBeVisible();

      await completeExpensesValues(page);

      await expect(page).toHaveURL(`/cases/PC-1922-1879/financial-eligibility/change/check-answers`);
      await expect(page.getByRole('heading', { name: 'Check your answers' })).toBeVisible();
      await expect(page.getByRole('heading', { level: 3, name: 'Details' })).toBeVisible();
    });

    test('should route expenses to partner expenses when partner is yes', async ({ page }) => {
      await reachIncomeWithPartner(page);
      await completeIncomeValues(page);
      await completePartnerIncomeValues(page);
      await completePartnerDependantsValues(page);

      await expect(page).toHaveURL(`/cases/PC-1922-1879/financial-eligibility/change/your-expenses`);
      await completeExpensesValues(page);

      await expect(page).toHaveURL(`/cases/PC-1922-1879/financial-eligibility/change/partner-expenses`);
      await expect(page.getByRole('heading', { name: 'Your partner\'s expenses' })).toBeVisible();
    });
  });

  test.describe('"Your partner\'s expenses" routing paths', () => {
    test('should route partner expenses to check answers', async ({ page }) => {
      await reachIncomeWithPartner(page);
      await completeIncomeValues(page);
      await completePartnerIncomeValues(page);
      await completePartnerDependantsValues(page);
      await completeExpensesValues(page);

      await expect(page).toHaveURL(`/cases/PC-1922-1879/financial-eligibility/change/partner-expenses`);
      await completePartnerExpensesValues(page);

      await expect(page).toHaveURL(`/cases/PC-1922-1879/financial-eligibility/change/check-answers`);
      await expect(page.getByRole('heading', { name: 'Check your answers' })).toBeVisible();
      await expect(page.getByRole('heading', { level: 3, name: 'Details' })).toBeVisible();
    });
  });

  test.describe('"Your partner\'s expenses" validation', () => {
    test('should show required field error when mortgage is unanswered', async ({ page }) => {
      await reachIncomeWithPartner(page);
      await completeIncomeValues(page);
      await completePartnerIncomeValues(page);
      await completePartnerDependantsValues(page);
      await completeExpensesValues(page);

      await expect(page).toHaveURL(`/cases/PC-1922-1879/financial-eligibility/change/partner-expenses`);
      await page.getByRole('button', { name: 'Continue' }).click();

      await expect(page.getByRole('link', { name: 'Enter how much your partner pays for their mortgage' })).toBeVisible();
    });
  });

  test.describe('Check answers and submission', () => {
    test('should submit finances answers from check answers and return to financial eligibility tab', async ({ page }) => {
      await reachExpensesNoPartner(page);
      await completeExpensesValues(page);

      await expect(page).toHaveURL(`/cases/PC-1922-1879/financial-eligibility/change/check-answers`);
      await expect(page.getByRole('heading', { name: 'Property 1' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Property 2' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Your savings' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Disregards' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Your income' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Dependants' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Your expenses' })).toBeVisible();

      await page.getByRole('button', { name: 'Submit' }).click();

      await expect(page).toHaveURL(`/cases/PC-1922-1879/financial-eligibility/`);
      await expect(page).not.toHaveURL(`/cases/PC-1922-1879/financial-eligibility/change`);
    });

    test('should allow changing a finance answer from check answers', async ({ page }) => {
      await reachExpensesNoPartner(page);
      await completeExpensesValues(page);

      await expect(page).toHaveURL(`/cases/PC-1922-1879/financial-eligibility/change/check-answers`);

      await page.getByRole('link', { name: 'Change' }).first().click();
      await expect(page).not.toHaveURL(`/cases/PC-1922-1879/financial-eligibility/change/check-answers`);

      await page.getByRole('button', { name: 'Continue' }).click();
    });

  });
});
