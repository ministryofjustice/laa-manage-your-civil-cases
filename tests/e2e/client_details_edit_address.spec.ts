import { test, expect } from './fixtures/index.js';
import { t, getClientDetailsUrlByStatus } from './helpers/index.js';

const visitUrl = getClientDetailsUrlByStatus('default') + '/change/address';
const clientDetailsUrl = getClientDetailsUrlByStatus('default');

test('viewing change address form, to see the expected elements', async ({ page, i18nSetup }) => {
  const addressInput = page.locator('#address');
  const postcodeInput = page.locator('#postcode');
  const saveButton = page.getByRole('button', { name: t('common.save') });

  // Navigate to the `/change/address`
  await page.goto(visitUrl);

  // Expect to see the following elements
  await expect(page.locator('h1')).toContainText(t('forms.clientDetails.address.title'));
  await expect(addressInput).toBeVisible();
  await expect(postcodeInput).toBeVisible();
  await expect(saveButton).toBeVisible();

  // Note: Form pre-population testing requires mock data service configuration
  // For now, we test the form structure without specific data expectations
});

test('unchanged fields trigger change detection error (AC5)', async ({ page, i18nSetup }) => {
  const saveButton = page.getByRole('button', { name: t('common.save') });
  const errorSummary = page.locator('.govuk-error-summary');

  // Navigate to the edit form
  await page.goto(visitUrl);

  // Submit form (should trigger AC5 validation error)
  await expect(saveButton).toBeVisible();
  await saveButton.click();

  // Check GOV.UK error summary appears for change detection
  await expect(errorSummary).toBeVisible();
  await expect(errorSummary).toContainText(t('components.errorSummary.title'));
  await expect(errorSummary).toContainText(t('forms.clientDetails.address.validationError.notChanged'));

  // AC5 change detection error should NOT have inline field error messages
  const addressErrorMessage = page.locator('#address-error');
  const postcodeErrorMessage = page.locator('#postcode-error');
  await expect(addressErrorMessage).not.toBeVisible();
  await expect(postcodeErrorMessage).not.toBeVisible();
});

test('save button should redirect to client details when valid data submitted', async ({ page, i18nSetup }) => {
  const addressInput = page.locator('#address');
  const postcodeInput = page.locator('#postcode');
  const saveButton = page.getByRole('button', { name: t('common.save') });

  // Navigate to the change address form
  await page.goto(visitUrl);

  // Fill in valid address details (ensure they're different from any existing data)
  await addressInput.fill('123 New Street\nLondon');
  await postcodeInput.fill('SW1A 1AA');

  // Submit the form
  await saveButton.click();

  // Should redirect to client details page
  await expect(page).toHaveURL(clientDetailsUrl);
});

test('address edit page should be accessible', {
  tag: '@accessibility',
}, async ({ page, checkAccessibility }) => {
  await page.goto(visitUrl);
  await checkAccessibility();
});
