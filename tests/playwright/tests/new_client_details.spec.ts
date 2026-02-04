import { test, expect } from '../fixtures/index.js';
import { getClientDetailsUrlByStatus, setupAuth, assertCaseDetailsHeaderPresent } from '../utils/index.js';

// Login before each test since client details pages require authentication
test.beforeEach(async ({ page }) => {
  await setupAuth(page);
});

test('client details selected from new cases tab has correct page elements', async ({ page, i18nSetup }) => {
  // Navigate to the client details
  await page.goto(getClientDetailsUrlByStatus('new'));

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, true, "Jack Youngs", "PC-1922-1879", "7 Jul 2025"); 
  
  const new_tag = page.getByText('New', { exact: true });
  const changeStatusButton = page.getByRole('button', { name: 'Change status' });
  const advisingMenuItem = page.getByRole('button', { name: 'Advising' });
  const pendingMenuItem = page.getByRole('button', { name: 'Pending' });
  const closedMenuItem = page.getByRole('button', { name: 'Closed' });

  // expect to see the following elements
  await expect(new_tag).toBeVisible();
  await expect(changeStatusButton).toBeVisible();

  // After opening the menu, the correct options should be visible
  await changeStatusButton.click();
  await expect(advisingMenuItem).toBeVisible();
  await expect(pendingMenuItem).toBeVisible();
  await expect(closedMenuItem).toBeVisible();
});

test('client support needs card is not shown on new case when `skype_webcam` is true', async ({ page, i18nSetup }) => {
  // Navigate to the client details
  await page.goto(getClientDetailsUrlByStatus('new'));

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, true, "Jack Youngs", "PC-1922-1879", "7 Jul 2025"); 

  const new_tag = page.getByText('New', { exact: true });
  const changeStatusButton = page.getByRole('button', { name: 'Change status' });
  const advisingMenuItem = page.getByRole('button', { name: 'Advising' });
  const pendingMenuItem = page.getByRole('button', { name: 'Pending' });
  const closedMenuItem = page.getByRole('button', { name: 'Closed' });

  // expect to see the following elements
  await expect(new_tag).toBeVisible();
  await expect(changeStatusButton).toBeVisible();

  // After opening the menu, the correct options should be visible
  await changeStatusButton.click();
  await expect(advisingMenuItem).toBeVisible();
  await expect(pendingMenuItem).toBeVisible();
  await expect(closedMenuItem).toBeVisible();

  // 'Jack Youngs' clientSupportNeeds data in `tests/playwright/fixtures/mock-data.json`, has been adjusted to mock this scenario
  const clientSupportNeedsButton = page.getByRole('button', { name: 'Add client support need' });
  await expect(clientSupportNeedsButton).toBeVisible();
});


test('new client details page should be accessible', {
  tag: '@accessibility',
}, async ({ page, checkAccessibility }) => {
  await page.goto(getClientDetailsUrlByStatus('new'));
  await checkAccessibility();
});
