import { test, expect } from './fixtures/index.js';
import { t, getClientDetailsUrlByStatus } from './helpers/index.js';

const visitUrl = getClientDetailsUrlByStatus('default') + '/client-details/edit/third-party';
const clientDetailsUrl = getClientDetailsUrlByStatus('default');

test('viewing edit third party form should display expected elements', async ({ page, i18nSetup }) => {
  const nameInput = page.locator('#thirdPartyName');
  const relationshipInput = page.locator('#relationship');
  const phoneInput = page.locator('#phoneNumber');
  const emailInput = page.locator('#emailAddress');
  const saveButton = page.getByRole('button', { name: t('common.save') });
  const cancelLink = page.getByRole('link', { name: t('common.cancel') });

  // Navigate to the edit third party form
  await page.goto(visitUrl);

  // Expect to see the main elements
  await expect(page.locator('h1')).toContainText(t('forms.thirdParty.edit.title'));
  await expect(nameInput).toBeVisible();
  await expect(relationshipInput).toBeVisible();
  await expect(phoneInput).toBeVisible();
  await expect(emailInput).toBeVisible();
  await expect(saveButton).toBeVisible();
  await expect(cancelLink).toBeVisible();

  // Expect form to be pre-populated with existing data
  await expect(nameInput).not.toHaveValue('');
});

test('cancel link should navigate back to client details', async ({ page, i18nSetup }) => {
  const cancelLink = page.getByRole('link', { name: t('common.cancel') });

  // Navigate to the edit third party form
  await page.goto(visitUrl);

  // Click cancel link
  await cancelLink.click();

  // Should navigate back to client details
  await expect(page).toHaveURL(clientDetailsUrl);
});

test('save button should redirect to client details when valid data submitted', async ({ page, i18nSetup }) => {
  const nameInput = page.locator('#thirdPartyName');
  const relationshipInput = page.locator('#relationship');
  const phoneInput = page.locator('#phoneNumber');
  const emailInput = page.locator('#emailAddress');
  const saveButton = page.getByRole('button', { name: t('common.save') });

  // Navigate to the edit third party form
  await page.goto(visitUrl);

  // Update third party details
  await nameInput.fill('Jane Smith');
  await relationshipInput.fill('Sister');
  await phoneInput.fill('07700900456');
  await emailInput.fill('jane.smith@example.com');

  // Submit the form
  await saveButton.click();

  // Should redirect to client details page
  await expect(page).toHaveURL(clientDetailsUrl);
});

test('edit third party form displays validation errors correctly', async ({ page, i18nSetup }) => {
  const nameInput = page.locator('#thirdPartyName');
  const saveButton = page.getByRole('button', { name: t('common.save') });

  // Navigate to the edit third party form
  await page.goto(visitUrl);

  // Submit form with invalid data
  await nameInput.fill(''); // Clear the name

  // Find and click the save button
  await expect(saveButton).toBeVisible();
  await saveButton.click();

  // Check GOV.UK error summary appears
  const errorSummary = page.locator('.govuk-error-summary');
  await expect(errorSummary).toBeVisible();

  // Check individual field errors appear
  const nameError = page.locator('#thirdPartyName-error');
  await expect(nameError).toBeVisible();
  await expect(nameError).toContainText(t('forms.thirdParty.name.validation.required'));
});

test('unchanged fields trigger change detection error', async ({ page, i18nSetup }) => {
  const saveButton = page.getByRole('button', { name: t('common.save') });

  // Navigate to the edit third party form
  await page.goto(visitUrl);

  // Submit form without making any changes
  // (assuming the form loads with existing third party data)
  await expect(saveButton).toBeVisible();
  await saveButton.click();

  // Check GOV.UK error summary appears for change detection
  const errorSummary = page.locator('.govuk-error-summary');
  await expect(errorSummary).toBeVisible();
  await expect(errorSummary).toContainText(t('forms.validation.noChanges'));
});