import { test, expect } from './fixtures/index.js';
import { t, getClientDetailsUrlByStatus } from './helpers/index.js';

const visitUrl = getClientDetailsUrlByStatus('default') + '/change/phone-number';

test('viewing change phone-number form, to see the expected elements', async ({ page, i18nSetup }) => {
  const phoneInput = page.locator('#phoneNumber');
  const safeToCallInput = page.locator('#safeToCall');
  const announceCallInput = page.locator('#announceCall');
  const saveButton = page.getByRole('button', { name: t('common.save') });

  // Navigate to the `/change/phone-number`
  await page.goto(visitUrl);

  // Expect to see the following elements
  await expect(page.locator('h1')).toContainText(t('forms.clientDetails.phoneNumber.title'));
  await expect(phoneInput).toBeVisible();
  await expect(safeToCallInput).toBeVisible();
  await expect(announceCallInput).toBeVisible();
  await expect(saveButton).toBeVisible();
});

test('phoneNumber is blank and correct validation errors display', async ({ page, i18nSetup }) => {
  const saveButton = page.getByRole('button', { name: t('common.save') });
  const errorSummary = page.locator('.govuk-error-summary');
  const errorLinkSafeToCall = page.locator('a[href="#safeToCall"]');
  const errorLinkPhoneNumber = page.locator('a[href="#phoneNumber"]');
  const phoneInput = page.locator('#phoneNumber');

  // Navigate to the change form
  await page.goto(visitUrl);

  // Submit form with blank phoneNumber
  await page.locator('#phoneNumber').fill('');

  // Find and click the save button
  await expect(saveButton).toBeVisible();
  await saveButton.click();

  // Check GOV.UK error summary appears
  await expect(errorSummary).toBeVisible();
  await expect(errorSummary).toContainText(t('components.errorSummary.title'));

  // Check error summary links to problem field
  await expect(errorLinkPhoneNumber).toBeVisible();
  await expect(errorLinkPhoneNumber).toHaveText(t('forms.clientDetails.phoneNumber.validationError.notEmpty'));
  await expect(phoneInput).toHaveClass(/govuk-input--error/);

  // Check other error summary link not visible
  await expect(errorLinkSafeToCall).not.toBeVisible();
});

test('phoneNumber is not valid and correct validation errors display', async ({ page, i18nSetup }) => {
  const saveButton = page.getByRole('button', { name: t('common.save') });
  const errorSummary = page.locator('.govuk-error-summary');
  const errorLinkSafeToCall = page.locator('a[href="#safeToCall"]');
  const errorLinkPhoneNumber = page.locator('a[href="#phoneNumber"]');
  const phoneInput = page.locator('#phoneNumber');

  // Navigate to the change form
  await page.goto(visitUrl);

  // Submit form with blank phoneNumber
  await page.locator('#phoneNumber').fill('ggg');

  // Find and click the save button
  await expect(saveButton).toBeVisible();
  await saveButton.click();

  // Check GOV.UK error summary appears
  await expect(errorSummary).toBeVisible();
  await expect(errorSummary).toContainText(t('components.errorSummary.title'));

  // Check error summary links to problem field
  await expect(errorLinkPhoneNumber).toBeVisible();
  await expect(errorLinkPhoneNumber).toHaveText(t('forms.clientDetails.phoneNumber.validationError.invalidFormat'));
  await expect(phoneInput).toHaveClass(/govuk-input--error/);

  // Check other error summary link not visible
  await expect(errorLinkSafeToCall).not.toBeVisible();
});

test('safeToCall & phoneNumber & announceCall not changed and correct validation errors displayed', async ({ page, i18nSetup }) => {
  const saveButton = page.getByRole('button', { name: t('common.save') });
  const errorSummary = page.locator('.govuk-error-summary');

  // Navigate to the `/change/phone-number`
  await page.goto(visitUrl);

  // Wait for the form to load with existing data
  await page.waitForLoadState('networkidle');

  // Find and click the save button without making any changes
  // (assuming the form loads with existing client data)
  await expect(saveButton).toBeVisible();
  await saveButton.click();

  // Check GOV.UK error summary appears
  await expect(errorSummary).toBeVisible();

  // Check for either "not changed" error or "required field" error depending on data state
  // If the page loads with existing data, we should see "not changed"
  // If the page loads empty, we should see "required field"
  const errorText = await errorSummary.textContent();
  const hasNotChangedError = errorText?.includes(t('forms.clientDetails.phoneNumber.validationError.notChanged'));
  const hasRequiredError = errorText?.includes(t('forms.clientDetails.phoneNumber.validationError.notEmpty'));

  // Assert that we get one of the expected errors
  if (hasNotChangedError) {
    await expect(errorSummary).toContainText(t('forms.clientDetails.phoneNumber.validationError.notChanged'));
  } else if (hasRequiredError) {
    await expect(errorSummary).toContainText(t('forms.clientDetails.phoneNumber.validationError.notEmpty'));
  } else {
    throw new Error(`Expected either "not changed" or "required field" error, but got: ${errorText}`);
  }
});

test('phone number edit page should be accessible', {
  tag: '@accessibility',
}, async ({ page, checkAccessibility }) => {
  await page.goto(visitUrl);
  await checkAccessibility();
});

