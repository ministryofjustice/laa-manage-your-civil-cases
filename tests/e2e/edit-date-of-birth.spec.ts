import { test, expect } from './fixtures/index.js';
import { t, getClientDetailsUrlByStatus } from './helpers/index.js';

const visitUrl = getClientDetailsUrlByStatus('default') + '/change/date-of-birth';
const clientDetailsUrl = getClientDetailsUrlByStatus('default');

test('viewing edit date of birth form should display expected elements', async ({ page, i18nSetup }) => {
  const dayInput = page.locator('#dateOfBirth-day');
  const monthInput = page.locator('#dateOfBirth-month');
  const yearInput = page.locator('#dateOfBirth-year');
  const saveButton = page.getByRole('button', { name: t('common.save') });
  const cancelLink = page.getByRole('link', { name: t('common.cancel') });

  // Navigate to the date of birth edit form
  await page.goto(visitUrl);

  // Expect to see the main elements
  await expect(page.locator('h1')).toContainText(t('forms.clientDetails.dateOfBirth.legend'));
  await expect(dayInput).toBeVisible();
  await expect(monthInput).toBeVisible();
  await expect(yearInput).toBeVisible();
  await expect(saveButton).toBeVisible();
  await expect(cancelLink).toBeVisible();

  // Check hint text is present
  await expect(page.locator('.govuk-hint')).toContainText(t('forms.clientDetails.dateOfBirth.hint'));

  // Check back link is present - use specific class to avoid selector conflicts
  await expect(page.locator('.govuk-back-link')).toBeVisible();
});

test('cancel link should navigate back to client details', async ({ page, i18nSetup }) => {
  const cancelLink = page.getByRole('link', { name: t('common.cancel') });

  // Navigate to the date of birth edit form
  await page.goto(visitUrl);

  // Click cancel link
  await cancelLink.click();

  // Should navigate back to client details
  await expect(page).toHaveURL(clientDetailsUrl);
});

test('save button should redirect to client details when no validation errors', async ({ page, i18nSetup }) => {
  const saveButton = page.getByRole('button', { name: t('common.save') });

  // Navigate to the date of birth edit form
  await page.goto(visitUrl);

  // Fill in a valid date
  await page.locator('#dateOfBirth-day').fill('15');
  await page.locator('#dateOfBirth-month').fill('5');
  await page.locator('#dateOfBirth-year').fill('1990');

  // Also populate the hidden original fields to simulate proper change detection
  // This works around the API service not providing original data in e2e tests
  await page.evaluate(() => {
    (document.querySelector('input[name="originalDay"]') as HTMLInputElement).value = '10';
    (document.querySelector('input[name="originalMonth"]') as HTMLInputElement).value = '3';
    (document.querySelector('input[name="originalYear"]') as HTMLInputElement).value = '1985';
  });

  // Click save button
  await saveButton.click();

  // Wait a moment for potential processing
  await page.waitForTimeout(1000);

  // Should redirect to client details
  await expect(page).toHaveURL(clientDetailsUrl);
});
