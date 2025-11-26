import { test, expect } from '../fixtures/index.js';
import { t, getClientDetailsUrlByStatus, setupAuth } from '../utils/index.js';

// Login before each test since client details pages require authentication
test.beforeEach(async ({ page }) => {
  await setupAuth(page);
});

test('client details selected from advising cases tab has correct page elements', async ({ page, i18nSetup }) => {
  // Navigate to the client details
  await page.goto(getClientDetailsUrlByStatus('advising'));

  const advising_tag = page.getByText('Advising', { exact: true });
  const changeStatusButton = page.getByRole('button', { name: 'Change status' });
  const completedMenuItem = page.getByRole('button', { name: 'Completed' });

  // expect to see the following elements
  await expect(advising_tag).toBeVisible();
  await expect(changeStatusButton).toBeVisible();

  // After opening the menu, the "Completed" option should be visible
  await changeStatusButton.click();
  await expect(completedMenuItem).toBeVisible();
});

test('accepted client details page should be accessible', {
  tag: '@accessibility',
}, async ({ page, checkAccessibility }) => {
  await page.goto(getClientDetailsUrlByStatus('advising'));
  await checkAccessibility();
});
