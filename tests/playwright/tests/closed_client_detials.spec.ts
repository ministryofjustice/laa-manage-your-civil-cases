import { test, expect } from '../fixtures/index.js';
import { t, getClientDetailsUrlByStatus, setupAuth } from '../utils/index.js';

// Login before each test since client details pages require authentication
test.beforeEach(async ({ page }) => {
  await setupAuth(page);
});

test('client details selected from closed cases tab has correct page elements', async ({ page, i18nSetup }) => {
  // Navigate to the client details
  await page.goto(getClientDetailsUrlByStatus('closed'));

  const closed_tag = page.getByText('Closed', { exact: true });
  const changeStatusButton = page.getByRole('button', { name: 'Change status' });
  const advisingMenuItem = page.getByRole('button', { name: 'Advising' });

  // expect to see the following elements
  await expect(closed_tag).toBeVisible();
  await expect(changeStatusButton).toBeVisible();

  
  // After opening the menu, the "Completed" option should be visible
  await changeStatusButton.click();
  await expect(advisingMenuItem).toBeVisible();
});

test('closed client details page should be accessible', {
  tag: '@accessibility',
}, async ({ page, checkAccessibility }) => {
  await page.goto(getClientDetailsUrlByStatus('closed'));
  await checkAccessibility();
});
