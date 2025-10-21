import { test, expect } from '../fixtures/index.js';
import { t } from '../utils/index.js';

test('homepage login screen should have the correct title & warning text', async ({ page, i18nSetup }) => {
  // Navigate to the homepage
  await page.goto('/');

  // Check for the title of the application
  await expect(page).toHaveTitle(/.*Manage your civil cases.*/);
});

test('homepage login screen should display LAA header', async ({ page, i18nSetup }) => {
  // Navigate to the homepage
  await page.goto('/');

  const header = page.getByRole('banner');
  const sign_in_button = page.getByRole('button', { name: t('pages.login.signInButton') });

  // Check for the header with LAA branding
  await expect(header).toBeVisible();
  // Check sign in button
  await expect(sign_in_button).toBeVisible();
});

test('homepage should display phase banner with hello content', async ({ page, i18nSetup }) => {
  // Navigate to the homepage
  await page.goto('/');

  // Target the phase banner
  const phaseBanner = page.locator('.govuk-phase-banner');

  // Check if the phase banner is visible
  await expect(phaseBanner).toBeVisible();

  // Check if feedback link text is in the phase banner
  await expect(phaseBanner).toContainText(t('components.phaseBanner.feedbackText'));
});

test('homepage should be accessible', {
  tag: '@accessibility',
}, async ({ page, checkAccessibility }) => {
  await page.goto('/');
  await checkAccessibility();
});