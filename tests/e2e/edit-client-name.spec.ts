import { test, expect } from './fixtures/index.js';
import { t, getClientDetailsUrlByStatus } from './helpers/index.js';

const visitUrl = getClientDetailsUrlByStatus('default') + '/change/name';
const clientDetailsUrl = getClientDetailsUrlByStatus('default');

test('viewing change name form should display expected elements', async ({ page, i18nSetup }) => {
  const nameInput = page.locator('#fullName');
  const saveButton = page.getByRole('button', { name: t('common.save') });
  const cancelLink = page.getByRole('link', { name: t('common.cancel') });

  // Navigate to the change name form
  await page.goto(visitUrl);

  // Expect to see the main elements
  await expect(page.locator('h1')).toContainText(t('forms.clientDetails.name.title'));
  await expect(nameInput).toBeVisible();
  await expect(saveButton).toBeVisible();
  await expect(cancelLink).toBeVisible();
});

test('cancel link should navigate back to client details', async ({ page, i18nSetup }) => {
  const cancelLink = page.getByRole('link', { name: t('common.cancel') });

  // Navigate to the change name form
  await page.goto(visitUrl);

  // Click cancel link
  await cancelLink.click();

  // Should navigate back to client details
  await expect(page).toHaveURL(clientDetailsUrl);
});

test('save button should redirect to client details when valid data submitted', async ({ page, i18nSetup }) => {
  const nameInput = page.locator('#fullName');
  const saveButton = page.getByRole('button', { name: t('common.save') });

  // Navigate to the change name form
  await page.goto(visitUrl);

  // Fill in valid name (ensure it's different from any existing data)
  await nameInput.fill('John Updated Smith');

  // Submit the form
  await saveButton.click();

  // Should redirect to client details page
  await expect(page).toHaveURL(clientDetailsUrl);
});

test('name form displays validation errors correctly', async ({ page, i18nSetup }) => {
  const nameInput = page.locator('#fullName');
  const saveButton = page.getByRole('button', { name: t('common.save') });

  // Navigate to the change name form
  await page.goto(visitUrl);

  // Submit form with empty name
  await nameInput.fill('');

  // Submit the form
  await saveButton.click();

  // Check GOV.UK error summary appears
  const errorSummary = page.locator('.govuk-error-summary');
  await expect(errorSummary).toBeVisible();

  // Check individual field error appears
  const nameError = page.locator('#fullName-error');
  await expect(nameError).toBeVisible();
});

test('unchanged name triggers change detection error', async ({ page, i18nSetup }) => {
  const saveButton = page.getByRole('button', { name: t('common.save') });

  // Navigate to the change name form
  await page.goto(visitUrl);

  // Wait for form to load with existing data
  await page.waitForLoadState('networkidle');

  // Submit form without making changes
  await saveButton.click();

  // Check GOV.UK error summary appears for change detection
  const errorSummary = page.locator('.govuk-error-summary');
  await expect(errorSummary).toBeVisible();
  await expect(errorSummary).toContainText(t('forms.clientDetails.name.validationError.notChanged'));
});

test('name edit page should be accessible', {
  tag: '@accessibility',
}, async ({ page, checkAccessibility }) => {
  await page.goto(visitUrl);
  await checkAccessibility();
});