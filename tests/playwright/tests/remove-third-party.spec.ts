import { test, expect } from '../fixtures/index.js';
import { getClientDetailsUrlByStatus, setupAuth } from '../utils/index.js';

const caseReference = 'PC-1922-1879';
const visitUrl = `/cases/${caseReference}/confirm/remove-third-party`;
const clientDetailsUrl = getClientDetailsUrlByStatus('default');

test.beforeEach(async ({ page }) => {
  await setupAuth(page);
});

test('viewing remove third party confirmation should display expected elements', async ({ page, i18nSetup }) => {
  await page.goto(visitUrl);

  await expect(page.locator('h1')).toContainText('Remove third party?');
  await expect(page.getByRole('button', { name: 'Yes, remove' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'No, go back to client details' })).toBeVisible();
  await expect(page.getByText('This will permanently delete all information about the third party.')).toBeVisible();
});

test('cancel link should navigate back to client details', async ({ page, i18nSetup }) => {
  await page.goto(visitUrl);
  await page.getByRole('button', { name: 'No, go back to client details' }).click();
  await expect(page).toHaveURL(clientDetailsUrl);
});

test('confirm button should delete third party contact and redirect to client details', async ({ page, i18nSetup }) => {
  await page.goto(visitUrl);
  await page.getByRole('button', { name: 'Yes, remove' }).click();
  await expect(page).toHaveURL(clientDetailsUrl);
});

test('confirmation page shows warning text about removing third party contact', async ({ page, i18nSetup }) => {
  await page.goto(visitUrl);
  await expect(page.locator('h1')).toContainText('Remove third party?');
  await expect(page.getByText('This will permanently delete all information about the third party.')).toBeVisible();
});

test('should show 404 error when case not found', async ({ page, i18nSetup }) => {
  const invalidCaseReference = 'PC-0000-0000';
  const invalidVisitUrl = `/cases/${invalidCaseReference}/confirm/remove-third-party`;
  await page.goto(invalidVisitUrl);
  await expect(page.locator('h1')).toContainText('404');
});

test('should show 404 error when case has no third party contact', async ({ page, i18nSetup }) => {
  await page.goto(visitUrl);
  await expect(page.locator('h1')).toContainText('Remove third party?');
});
