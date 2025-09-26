import { test, expect } from '../fixtures/index.js';
import { t, getClientDetailsUrlByStatus } from '../utils/index.js';

const visitUrl = getClientDetailsUrlByStatus('default') + '/change/phone-number';
const clientDetailsUrl = getClientDetailsUrlByStatus('default');

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

  // Debug: Check what form fields are pre-populated with
  const phoneInput = page.locator('#phoneNumber');
  const safeToCallInputs = page.locator('[name="safeToCall"]');
  const announceCallInputs = page.locator('[name="announceCall"]');
  
  console.log('=== FORM DEBUG INFO ===');
  console.log('Phone number value:', await phoneInput.inputValue());
  console.log('Safe to call checked values:', await safeToCallInputs.evaluateAll(inputs => inputs.map(i => (i as HTMLInputElement).checked)));
  console.log('Announce call checked values:', await announceCallInputs.evaluateAll(inputs => inputs.map(i => (i as HTMLInputElement).checked)));
  
  // Check for existing hidden fields that are used for change detection
  const existingPhoneNumber = page.locator('[name="existingPhoneNumber"]');
  const existingSafeToCall = page.locator('[name="existingSafeToCall"]');
  const existingAnnounceCall = page.locator('[name="existingAnnounceCall"]');
  
  console.log('Existing phone number:', await existingPhoneNumber.inputValue().catch(() => 'NOT FOUND'));
  console.log('Existing safe to call:', await existingSafeToCall.inputValue().catch(() => 'NOT FOUND'));
  console.log('Existing announce call:', await existingAnnounceCall.inputValue().catch(() => 'NOT FOUND'));

  // Find and click the save button without making any changes
  await expect(saveButton).toBeVisible();
  await saveButton.click();

  // Wait a moment for any redirect or validation to occur
  await page.waitForTimeout(2000);
  
  // Check current URL to see if we stayed on the form or redirected
  const currentUrl = page.url();
  console.log('URL after save:', currentUrl);
  
  // Check if we're still on the phone number edit form (indicates validation error)
  // or if we redirected to client details (indicates success)
  const isOnPhoneForm = currentUrl.includes('/change/phone-number');
  const isOnClientDetails = currentUrl.includes('/client-details') && !currentUrl.includes('/change/phone-number');
  
  console.log('Still on phone form:', isOnPhoneForm);
  console.log('Redirected to client details:', isOnClientDetails);

  // Check for any validation errors
  const errorSummaryExists = await errorSummary.isVisible().catch(() => false);
  console.log('Error summary visible:', errorSummaryExists);
  
  if (errorSummaryExists) {
    const errorText = await errorSummary.textContent();
    console.log('Error text:', errorText);
    
    // Check for specific validation errors
    const hasNotChangedError = errorText?.includes(t('forms.clientDetails.phoneNumber.validationError.notChanged'));
    const hasRequiredError = errorText?.includes(t('forms.clientDetails.phoneNumber.validationError.notEmpty'));
    const hasInvalidFormatError = errorText?.includes(t('forms.clientDetails.phoneNumber.validationError.invalidFormat'));
    
    console.log('Has not changed error:', hasNotChangedError);
    console.log('Has required error:', hasRequiredError);
    console.log('Has invalid format error:', hasInvalidFormatError);
    
    // Assert that we get the expected "not changed" error
    await expect(errorSummary).toContainText(t('forms.clientDetails.phoneNumber.validationError.notChanged'));
  } else if (isOnClientDetails) {
    // Form submitted successfully - this might be unexpected if we wanted validation
    throw new Error('Form submitted successfully without validation error - expected "not changed" validation to trigger');
  } else {
    // Something else happened
    throw new Error(`Unexpected state: no error summary and not on client details. Current URL: ${currentUrl}`);
  }
});

test('save button should redirect to client details when valid data submitted', async ({ page, i18nSetup }) => {
  const phoneInput = page.locator('#phoneNumber');
  const safeToCallRadios = page.locator('[name="safeToCall"]');
  const announceCallRadios = page.locator('[name="announceCall"]');
  const saveButton = page.getByRole('button', { name: t('common.save') });

  // Navigate to the change phone number form
  await page.goto(visitUrl);

  // Fill in valid phone number details
  await phoneInput.fill('07700900123');
  await safeToCallRadios.first().check(); // Select "Yes" for safe to call
  await announceCallRadios.first().check(); // Select "Yes" for announce call

  // Submit the form
  await saveButton.click();

  // Should redirect to client details page
  await expect(page).toHaveURL(clientDetailsUrl);
});

test('phone number edit page should be accessible', {
  tag: '@accessibility',
}, async ({ page, checkAccessibility }) => {
  await page.goto(visitUrl);
  await checkAccessibility();
});

