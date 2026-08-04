import { test, expect } from '../fixtures/index.js';
import { t, setupAuth } from '../utils/index.js';

test('help page has correct title header', async ({ page, i18nSetup }) => {
    // Navigate to homepage
    await page.goto('/help');

    // Check for the title fo the application
    await expect(page).toHaveTitle(/.*Manage your civil cases.*/);
});

test('help page should display LAA header', async ({ page, i18nSetup }) => {
  // Navigate to the homepage
  await page.goto('/help');

  const header = page.getByRole('banner');

  // Check for the header with LAA branding
  await expect(header).toBeVisible();
});

test('help page should display phase banner with hello content', async ({ page, i18nSetup }) => {
  // Navigate to the homepage
  await page.goto('/help');

  // Target the phase banner
  const phaseBanner = page.locator('.govuk-phase-banner');

  // Check if the phase banner is visible
  await expect(phaseBanner).toBeVisible();

  // Check if feedback link text is in the phase banner
  await expect(phaseBanner).toContainText(t('components.phaseBanner.feedbackText'));
});

test('footer is visible with expected links', async ({ page }) => {  
  await page.goto('/help');

  const footer = page.locator('.govuk-footer');
  await expect(footer).toBeVisible();
  await expect(footer.getByRole('link', { name: 'Help' })).toBeVisible();
  await expect(footer.getByRole('link', { name: 'Privacy' })).toBeVisible();
  await expect(footer.getByRole('link', { name: 'Cookies' })).toBeVisible();
  await expect(footer.getByRole('link', { name: 'Accessibility' })).toBeVisible();
  await expect(footer.getByRole('link', { name: 'Terms and conditions' })).toBeVisible();
});

const visitUrl = '/accessibility';
test('help page should have rendered correctly', async ({ page, i18nSetup }) => {
  // Navigate to the accessibility page
  await page.goto(visitUrl);

   // Check nav bar exists
  const nav = page.locator('.govuk-service-navigation');
  await expect(nav).toBeVisible();

   // Check service name is visible in the navigation section of the screen
  await expect(nav).toContainText('Manage your civil cases');

  // Check the links are not in the nav bar
  await expect(page.getByRole('link', { name: 'Your cases' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Search' })).toHaveCount(0);

  // Check for the heading of the help page
  await expect(page.getByRole('heading', { level: 1, name: t('pages.accessibility.heading') })).toBeVisible();

   // Verify the text of the heading of the accessibility page
  const accessibilityHeading = page.locator('#accessibility-heading');
  await expect(accessibilityHeading).toHaveText('Accessibility statement');

   // Verify the text for the accessibility intro
  const accessibilityIntro = page.locator('#accessibility-intro');
  await expect(accessibilityIntro).toHaveText("This accessibility statement applies to the 'Manage your civil cases' service.");

  // Verify the text for the service statement


})
