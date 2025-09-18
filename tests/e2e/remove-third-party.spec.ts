import { test, expect } from './fixtures/index.js';
import { t, getClientDetailsUrlByStatus } from './helpers/index.js';

const visitUrl = getClientDetailsUrlByStatus('default') + '/confirm/remove-third-party';
const clientDetailsUrl = getClientDetailsUrlByStatus('default');

test('viewing remove third party confirmation should display expected elements', async ({ page, i18nSetup }) => {
  const confirmButton = page.getByRole('button', { name: t('forms.thirdParty.remove.confirmButton') });
  const cancelLink = page.getByRole('link', { name: t('common.cancel') });

  // Navigate to the remove third party confirmation
  await page.goto(visitUrl);

  // Expect to see the main elements
  await expect(page.locator('h1')).toContainText(t('forms.thirdParty.remove.title'));
  await expect(confirmButton).toBeVisible();
  await expect(cancelLink).toBeVisible();

  // Check for warning text
  await expect(page.locator('.govuk-warning-text')).toBeVisible();
  await expect(page.locator('.govuk-warning-text')).toContainText(t('forms.thirdParty.remove.warning'));
});

test('cancel link should navigate back to client details', async ({ page, i18nSetup }) => {
  const cancelLink = page.getByRole('link', { name: t('common.cancel') });

  // Navigate to the remove third party confirmation
  await page.goto(visitUrl);

  // Click cancel link
  await cancelLink.click();

  // Should navigate back to client details
  await expect(page).toHaveURL(clientDetailsUrl);
});

test('confirm button should delete third party and redirect to client details', async ({ page, i18nSetup }) => {
  const confirmButton = page.getByRole('button', { name: t('forms.thirdParty.remove.confirmButton') });

  // Navigate to the remove third party confirmation
  await page.goto(visitUrl);

  // Click confirm button
  await expect(confirmButton).toBeVisible();
  await confirmButton.click();

  // Should redirect to client details page
  await expect(page).toHaveURL(clientDetailsUrl);
});

test('confirmation page shows third party details to be removed', async ({ page, i18nSetup }) => {
  // Navigate to the remove third party confirmation
  await page.goto(visitUrl);

  // Check that third party details are displayed
  const summaryList = page.locator('.govuk-summary-list');
  await expect(summaryList).toBeVisible();

  // Check for third party name
  await expect(page.locator('.govuk-summary-list__key')).toContainText(t('forms.thirdParty.name.label'));
  
  // Check for relationship
  await expect(page.locator('.govuk-summary-list__key')).toContainText(t('forms.thirdParty.relationship.label'));
});