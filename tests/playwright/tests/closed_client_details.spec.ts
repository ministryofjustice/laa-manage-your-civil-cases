import { test, expect } from '../fixtures/index.js';
import { getClientDetailsUrlByStatus, setupAuth, assertCaseDetailsHeaderPresent } from '../utils/index.js';

// Login before each test since client details pages require authentication
test.beforeEach(async ({ page }) => {
  await setupAuth(page);
});

test('client details selected from closed cases tab has correct page elements', async ({ page, i18nSetup }) => {
  // Navigate to the client details
  await page.goto(getClientDetailsUrlByStatus('closed'));

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, { withMenuButtons: true, expectedName: "Roronoa Zoro", expectedCaseRef: "PC-6667-9089", dateReceived: "6 Jan 2025" });  

  const closed_tag = page.getByText('Closed', { exact: true });
  const changeStatusButton = page.getByRole('button', { name: 'Change status' });
  const advisingMenuItem = page.getByRole('button', { name: 'Advising' });
  const alertBanner = page.locator('.mcc-alert-banner');

  // expect to see the following elements
  await expect(closed_tag).toBeVisible();
  await expect(changeStatusButton).toBeVisible();
  await expect(alertBanner).toBeVisible();
  
  // After opening the menu, the "Advising" option should be visible
  await changeStatusButton.click();
  await expect(advisingMenuItem).toBeVisible();
});

test('client support needs card is not shown on new case when `minicom` is true and `skype` is false', async ({ page, i18nSetup }) => {
  // Navigate to the client details
  await page.goto(getClientDetailsUrlByStatus('closed'));

  await assertCaseDetailsHeaderPresent(page, { withMenuButtons: true, expectedName: "Roronoa Zoro", expectedCaseRef: "PC-6667-9089", dateReceived: "6 Jan 2025" });  

  // 'Roronoa Zoro' clientSupportNeeds data in `tests/playwright/fixtures/mock-data.json`, has been adjusted to mock this scenario
  const clientSupportNeedsButton = page.getByRole('button', { name: 'Add client support need' });
  await expect(clientSupportNeedsButton).toBeVisible();
});


test('closed client details page should be accessible', {
  tag: '@accessibility',
}, async ({ page, checkAccessibility }) => {
  await page.goto(getClientDetailsUrlByStatus('closed'));
  await checkAccessibility();
});
