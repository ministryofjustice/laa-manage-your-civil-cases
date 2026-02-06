import { test, expect } from '../fixtures/index.js';
import { getClientDetailsUrlByStatus, setupAuth, assertCaseDetailsHeaderPresent } from '../utils/index.js';

const caseReference = 'PC-1922-1879';
const visitUrl = `/cases/${caseReference}/confirm/remove-third-party`;
const clientDetailsUrl = getClientDetailsUrlByStatus('default');

test.beforeEach(async ({ page }) => {
  await setupAuth(page);
});

test('viewing remove third party confirmation should display expected elements', async ({ page, i18nSetup }) => {
  await page.goto(clientDetailsUrl);
  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, true, "Jack Youngs", "PC-1922-1879", "7 Jul 2025");
  await page.goto(visitUrl);

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, false, "Jack Youngs", "PC-1922-1879", "7 Jul 2025"); 

  // Header components 
  const dateReceivedText = page.getByText('Date received', { exact: true });
  const laaReferenceText = page.getByText('LAA reference', { exact: true });

  await expect(dateReceivedText).toBeVisible();
  await expect(laaReferenceText).toBeVisible();
  await expect(page.locator('h1')).toContainText('Remove third party?');
  await expect(page.getByRole('button', { name: 'Yes, remove' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'No, go back to client details' })).toBeVisible();
  await expect(page.getByText('This will permanently delete all information about the third party.')).toBeVisible();
});

test('cancel link should navigate back to client details', async ({ page, i18nSetup }) => {
  await page.goto(clientDetailsUrl);
  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, true, "Jack Youngs", "PC-1922-1879", "7 Jul 2025"); 
  await page.goto(visitUrl);
  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, false, "Jack Youngs", "PC-1922-1879", "7 Jul 2025"); 

  await page.getByRole('button', { name: 'No, go back to client details' }).click();
  await expect(page).toHaveURL(clientDetailsUrl);
});

test('confirm button should delete third party contact and redirect to client details', async ({ page, i18nSetup }) => {
  await page.goto(clientDetailsUrl);
  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, true, "Jack Youngs", "PC-1922-1879", "7 Jul 2025");
  await page.goto(visitUrl);
  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, false, "Jack Youngs", "PC-1922-1879", "7 Jul 2025"); 
  await page.getByRole('button', { name: 'Yes, remove' }).click();
  await expect(page).toHaveURL(clientDetailsUrl);
});

test('confirmation page shows warning text about removing third party contact', async ({ page, i18nSetup }) => {
  await page.goto(clientDetailsUrl);
  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, true, "Jack Youngs", "PC-1922-1879", "7 Jul 2025");
  await page.goto(visitUrl);
  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, false, "Jack Youngs", "PC-1922-1879", "7 Jul 2025");
  await expect(page.locator('h1')).toContainText('Remove third party?');
  await expect(page.getByText('This will permanently delete all information about the third party.')).toBeVisible();
});

