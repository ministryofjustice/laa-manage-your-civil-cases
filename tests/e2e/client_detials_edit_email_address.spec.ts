import { test, expect } from './fixtures/index.js';
import { t, getClientDetailsUrlByStatus } from './helpers/index.js';

const visitUrl = getClientDetailsUrlByStatus('default') + '/change/email-address';

test('viewing change email-address form, to see the expected elements', async ({ page, i18nSetup }) => {
  const emailInput = page.locator('#emailAddress');
  const saveButton = page.getByRole('button', { name: t('common.save') });

  // Navigate to the `/change/email-address`
  await page.goto(visitUrl);

  // Expect to see the following elements
  await expect(page.locator('h1')).toContainText(t('forms.clientDetails.email.title'));
  await expect(emailInput).toBeVisible();
  await expect(saveButton).toBeVisible();
});


test('change email address form displays validation errors correctly', async ({ page, i18nSetup }) => {
  const saveButton = page.getByRole('button', { name: t('common.save') });
  const errorSummary = page.locator('.govuk-error-summary');
  const errorLink = page.locator('.govuk-error-summary a[href="#emailAddress"]');
  const errorMessage = page.locator('.govuk-error-message');
  const emailInput = page.locator('#emailAddress');

  // Navigate to the change form
  await page.goto(visitUrl);

  // Submit form with invalid email
  await page.locator('#emailAddress').fill('JackYoungs.com');

  // Find and click the save button
  await expect(saveButton).toBeVisible();
  await saveButton.click();

  // Should stay on same page (not redirect)
  expect(page.url()).toContain('/change/email-address');

  // Check GOV.UK error summary appears
  await expect(errorSummary).toBeVisible();
  await expect(errorSummary).toContainText(t('components.errorSummary.title'));

  // Check error summary links to problem field
  await expect(errorLink).toBeVisible();
  // Check field-level error styling
  await expect(emailInput).toHaveClass(/govuk-input--error/);

  // Check error message appears near the field
  await expect(errorMessage).toBeVisible();
  await expect(errorMessage).toContainText(t('forms.clientDetails.email.validationError.invalidFormat'));
});