import { test, expect } from '../fixtures/index.js';
import { setupAuth } from '../utils/index.js';
import { t } from '../utils/index.js';

test.beforeEach(async ({ page }) => {
  await setupAuth(page);
});

test('Logged in view should have the correct title', async ({ page, i18nSetup }) => {
  // Check for the title of the application
  await expect(page).toHaveTitle(/.*Manage your civil cases.*/);
});

test('Logged in view should display LAA header', async ({ page, i18nSetup }) => {
  // Check for the header with LAA branding & User e-mail
  const header = page.getByRole('banner');
  const userEmail = page.getByText('test-user@example.com')
  await expect(header).toBeVisible();
  await expect(userEmail).toBeVisible();
});

test('Logged in view should display phase banner', async ({ page, i18nSetup }) => {
  // Target the phase banner
  const phaseBanner = page.locator('.govuk-phase-banner');

  // Check if the phase banner is visible
  await expect(phaseBanner).toBeVisible();

  // Check if feedback link text is in the phase banner
  await expect(phaseBanner).toContainText(t('components.phaseBanner.feedbackText'));
});

test('Logged in view should be accessible', {
  tag: '@accessibility',
}, async ({ page, checkAccessibility }) => {
  await checkAccessibility();
});