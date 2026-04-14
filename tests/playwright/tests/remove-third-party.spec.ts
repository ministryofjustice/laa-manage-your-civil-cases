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
  await assertCaseDetailsHeaderPresent(page, { withMenuButtons: true, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 July 2025", badgeTexts: ['Urgent', 'At risk of abuse', 'Third Party'] }); 
  await page.goto(visitUrl);

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, { withMenuButtons: false, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 July 2025", badgeTexts: ['Urgent', 'At risk of abuse', 'Third Party'] }); 

  await expect(page.locator('h2.govuk-heading-m')).toContainText('Remove third party?');
  await expect(page.getByRole('button', { name: 'Yes, remove' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'No, go back to client details' })).toBeVisible();
  await expect(page.getByText('This will permanently delete all information about the third party.')).toBeVisible();
});

test('cancel link should navigate back to client details', async ({ page, i18nSetup }) => {
  await page.goto(clientDetailsUrl);
  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, { withMenuButtons: true, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 July 2025", badgeTexts: ['Urgent', 'At risk of abuse', 'Third Party'] }); 
  await page.goto(visitUrl);
  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, { withMenuButtons: false, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 July 2025", badgeTexts: ['Urgent', 'At risk of abuse', 'Third Party'] }); 

  await page.getByRole('button', { name: 'No, go back to client details' }).click();
  await expect(page).toHaveURL(clientDetailsUrl);
});

test('confirm button should delete third party contact and redirect to client details', async ({ page, i18nSetup }) => {
  await page.goto(clientDetailsUrl);
  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, { withMenuButtons: true, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 July 2025", badgeTexts: ['Urgent', 'At risk of abuse', 'Third Party'] }); 
  await page.goto(visitUrl);
  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, { withMenuButtons: false, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 July 2025", badgeTexts: ['Urgent', 'At risk of abuse', 'Third Party'] }); 
  await page.getByRole('button', { name: 'Yes, remove' }).click();
  await expect(page).toHaveURL(clientDetailsUrl);
});

test('confirmation page shows warning text about removing third party contact', async ({ page, i18nSetup }) => {
  await page.goto(clientDetailsUrl);
  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, { withMenuButtons: true, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 July 2025", badgeTexts: ['Urgent', 'At risk of abuse', 'Third Party'] }); 
  await page.goto(visitUrl);
  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, { withMenuButtons: false, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 July 2025", badgeTexts: ['Urgent', 'At risk of abuse', 'Third Party'] }); 
  await expect(page.locator('h2.govuk-heading-m')).toContainText('Remove third party?');
  await expect(page.getByText('This will permanently delete all information about the third party.')).toBeVisible();
});

