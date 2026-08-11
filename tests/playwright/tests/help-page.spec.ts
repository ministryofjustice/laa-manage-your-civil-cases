import { test, expect } from '../fixtures/index.js';
import { t, setupAuth } from '../utils/index.js';

test('help page has correct title header', async ({ page, i18nSetup }) => {
    // Navigate directly to the help page
    await page.goto('/help');

    // Check for the title fo the application
    await expect(page).toHaveTitle(/.*Manage your civil cases.*/);
});

test('help page should display LAA header', async ({ page, i18nSetup }) => {
  // Navigate directly to the help page
  await page.goto('/help');

  const header = page.getByRole('banner');

  // Check for the header with LAA branding
  await expect(header).toBeVisible();
});

test('help page should display phase banner with hello content', async ({ page, i18nSetup }) => {
  // Navigate directly to the help page
  await page.goto('/help');

  // Target the phase banner
  const phaseBanner = page.locator('.govuk-phase-banner');

  // Check if the phase banner is visible
  await expect(phaseBanner).toBeVisible();

  // Check if feedback link text is in the phase banner
  await expect(phaseBanner).toContainText(t('components.phaseBanner.feedbackText'));
});

test('help page should not display nav bar with service name and nav links when user has not signed in', async ({ page }) => {
  // Navigate directly to the help page
  await page.goto('/help');

  // Check nav bar with service name and nav links is not present
  const nav = page.locator('.govuk-service-navigation');
  await expect(nav).toHaveCount(0);
});

test('footer is visible with expected links', async ({ page }) => {  
  // Navigate directly to the help page
  await page.goto('/help');

  const footer = page.locator('.govuk-footer');
  await expect(footer).toBeVisible();
  await expect(footer.getByRole('link', { name: 'Help' })).toBeVisible();
  await expect(footer.getByRole('link', { name: 'Privacy' })).toBeVisible();
  await expect(footer.getByRole('link', { name: 'Cookies' })).toBeVisible();
  await expect(footer.getByRole('link', { name: 'Accessibility' })).toBeVisible();
  await expect(footer.getByRole('link', { name: 'Terms and conditions' })).toBeVisible();
});

test('help page should have rendered correctly', async ({ page, i18nSetup }) => {
  // Navigate to the help page
  await page.goto('/help');

  // Check for the heading of the help page
  await expect(page.getByRole('heading', { level: 1, name: t('pages.help.heading') })).toBeVisible();

  // Verify the text of the heading of the help page
  const helpHeading = page.locator('#help-heading');
  await expect(helpHeading).toHaveText('Help');

  // Check for the tech support subheading on the help page
  await expect(page.getByRole('heading', { level: 2, name: t('pages.help.techSupportSubheading') })).toBeVisible();

  // Verify the text for the subheading on the help page
  const techSupportSubheading = page.locator('#tech-support-subheading');
  await expect(techSupportSubheading).toHaveText('Technical support');

  // Verify the text for how to request technical support
  const supportInfo = page.locator('#support-info');
  await expect(supportInfo).toHaveText("Contact MCC.Queries@justice.gov.uk for technical support.");

  // Check for the case enquiries subheading on the help page
  await expect(page.getByRole('heading', { level: 2, name: t('pages.help.caseEnquiriesSubheading') })).toBeVisible();

  // Verify the text for the subheading on the help page
  const caseEnquiriesSubheading = page.locator('#case-enquiries-subheading')
  await expect(caseEnquiriesSubheading).toHaveText('Case enquiries');

  // Verify the text for case enquiries
  const caseEnquiriesInfo = page.locator('#case-enquiries-info')
  await expect(caseEnquiriesInfo).toHaveText("Contact your contract manager for any non-technical support questions.");
});

test('nav links are hidden on help page when logged in', async ({ page }) => {
  await setupAuth(page);
  await page.goto('/');
  // navigate like a real user to help page
  await page.getByRole('link', { name: 'Help' }).click();

  // assert we are on help page
  await expect(page).toHaveURL('/help');

  // Check nav bar exists
  const nav = page.locator('.govuk-service-navigation');
  await expect(nav).toBeVisible();

  // Check service name is visible in the navigation section of the screen
  await expect(nav).toContainText('Manage your civil cases');

  // Check the links are not in the nav bar
  await expect(page.getByRole('link', { name: 'Your cases' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Search' })).toHaveCount(0);
});

test('help page can be accessed after signing out', async ({ page }) => {
  await setupAuth(page);
  await page.goto('/');

  // Sign out
  await page.getByRole('link', { name: 'Sign out' }).click();

  // Navigate to help page
  await page.goto('/help');

  // Verify user is on the help page
  await expect(page).toHaveURL('/help');

  // Verify the help page heading is displayed
  await expect(page.getByRole('heading', { level: 1, name: t('pages.help.heading') })).toBeVisible();
});

test('help page does not display navbar after signing out', async ({ page }) => {
  await setupAuth(page);
  await page.goto('/');

  // Sign out
  await page.getByRole('link', { name: 'Sign out' }).click();

  // Navigate to help page
  await page.goto('/help');

  // Verify user is on the help page
  await expect(page).toHaveURL('/help');

  // Verify the help page heading is displayed
  await expect(page.getByRole('heading', { level: 1, name: t('pages.help.heading') })).toBeVisible();

  // Check nav bar with service name and nav links is not present
  const nav = page.locator('.govuk-service-navigation');
  await expect(nav).toHaveCount(0);
});