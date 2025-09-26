import { test, expect } from '../fixtures/index.js';
import { t } from '../utils/index.js';

test('homepage should have the correct title & warning text', async ({ page, i18nSetup }) => {
  // Navigate to the homepage
  await page.goto('/');

  // Check for the title of the application
  await expect(page).toHaveTitle(/.*Manage your civil cases.*/);
});

test('homepage should display LAA header', async ({ page, i18nSetup }) => {
  // Navigate to the homepage
  await page.goto('/');

  const header = page.getByRole('banner');
  const signOutLink = header.getByRole('link', { name: t('common.signOut') });

  // Check for the header with LAA branding
  await expect(header).toBeVisible();
  // Check sign out link in header
  await expect(signOutLink).toBeVisible();
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