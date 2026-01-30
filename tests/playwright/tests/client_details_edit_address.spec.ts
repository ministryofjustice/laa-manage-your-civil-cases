import { test, expect } from '../fixtures/index.js';
import { t, getClientDetailsUrlByStatus, setupAuth, assertCaseDetailsHeaderPresent } from '../utils/index.js';

const visitUrl = getClientDetailsUrlByStatus('default') + '/change/address';
const clientDetailsUrl = getClientDetailsUrlByStatus('default');

test.beforeEach(async ({ page }) => {
  await setupAuth(page);
});

test('viewing change address form, to see the expected elements', async ({ page, i18nSetup }) => {
  const addressInput = page.locator('#address');
  const postcodeInput = page.locator('#postcode');
  const saveButton = page.getByRole('button', { name: t('common.save') });

  // Navigate to the `/change/address`
  await page.goto(visitUrl);

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, false, "Jack Youngs", "PC-1922-1879", "7 Jul 2025");  

  // Expect to see the following elements
  await expect(page.locator('h1')).toContainText(t('forms.clientDetails.address.title'));
  await expect(addressInput).toBeVisible();
  await expect(postcodeInput).toBeVisible();
  await expect(saveButton).toBeVisible();

  // Note: Form pre-population testing requires mock data service configuration
  // For now, we test the form structure without specific data expectations
});

test('unchanged fields trigger change detection error', async ({ page, i18nSetup }) => {
  const saveButton = page.getByRole('button', { name: t('common.save') });
  const errorSummary = page.locator('.govuk-error-summary');

  // Navigate to the edit form
  await page.goto(visitUrl);

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, false, "Jack Youngs", "PC-1922-1879", "7 Jul 2025"); 

  // Submit form
  await expect(saveButton).toBeVisible();
  await saveButton.click();

  // Check GOV.UK error summary appears for change detection
  await expect(errorSummary).toBeVisible();
  await expect(errorSummary).toContainText(t('components.errorSummary.title'));
  await expect(errorSummary).toContainText(t('forms.clientDetails.address.validationError.notChanged'));

  // Change detection error should NOT have inline field error messages
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

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, false, "Jack Youngs", "PC-1922-1879", "7 Jul 2025"); 

  // Fill in valid address details (ensure they're different from any existing data)
  await addressInput.fill('123 New Street\nLondon');
  await postcodeInput.fill('SW1A 1AA');

  // Submit the form
  await saveButton.click();

  // Should redirect to client details page
  await expect(page).toHaveURL(clientDetailsUrl);
});

test('should trigger postcode validation when 12 or more characters are entered', async ({ page, i18nSetup }) => {
  const addressInput = page.locator('#address');
  const postcodeInput = page.locator('#postcode');
  const saveButton = page.getByRole('button', { name: t('common.save') });
  const errorSummary = page.locator('.govuk-error-summary');

  // Navigate to the change address form
  await page.goto(visitUrl);

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, false, "Jack Youngs", "PC-1922-1879", "7 Jul 2025"); 

  // Fill in invalid postcode filed with 13 characters
  await addressInput.fill('123 New Street\nLondon');
  await postcodeInput.fill('TEST567890123');

  // Submit the form
  await saveButton.click();

  // Check GOV.UK error summary appears for change detection
  await expect(errorSummary).toBeVisible();
  await expect(errorSummary).toContainText(t('components.errorSummary.title'));
  await expect(errorSummary).toContainText(t('forms.clientDetails.address.validationError.isLength'));
});

test('address edit page should be accessible', {
  tag: '@accessibility',
}, async ({ page, checkAccessibility }) => {
  await page.goto(visitUrl);
  await checkAccessibility();
});
