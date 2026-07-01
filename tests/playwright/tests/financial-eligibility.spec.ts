
import { test, expect } from '../fixtures/index.js';
import { setupAuth, logout, assertCaseDetailsHeaderPresent, expectTableRows } from '../utils/index.js';
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


test('should display finances tab content', async ({ page }) => {
  const clientDetails = ClientDetailsPage.forCase(
    page,
    'PC-1922-1879'
  );

  await clientDetails.navigate();

  await page.getByRole('link', {
    name: 'Financial eligibility'
  }).click();

  await page.getByRole('tab', {
    name: 'Finances'
  }).click();

  await expect(
    page.getByRole('heading', { name: 'Properties' })
  ).toBeVisible();

  await expect(
    page.getByRole('heading', { name: 'Your savings' })
  ).toBeVisible();

  await expectTableRows(page, 'finances', {
    'How much was in your bank account/building society before your last payment went in?': '£200',
    'Do you have any investments, shares or ISAs?': '£100',
    'Do you have any valuable items worth over £500 each?': '£500',
    'Do you have any money owed to you?': '£200',
  });

  await expect(
    page.getByText('Vaccine damage payment')
  ).toBeVisible();

  await expect(
    page.getByText('Cost of living payments')
  ).toBeVisible();

  await expect(
    page.getByRole('button', { name: 'Edit assessment' })
  ).toBeVisible();
});

});
