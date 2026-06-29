import { test, expect } from '../fixtures/index.js';
import { t } from '../utils/index.js'

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

const visitUrl = '/cookies';
test('cookies page should have rendered correctly', async ({ page, i18nSetup }) => {
  // Navigate to the search page
  await page.goto(visitUrl);

  // Check for the heading of the cookies page
  await expect(page.getByRole('heading', { level: 1, name: t('pages.cookies.heading') })).toBeVisible();

  // Verify the text of the heading of the cookies page
  const cookiesHeading = page.locator('#cookies-heading')
  await expect(cookiesHeading).toHaveText('Cookies');

  // Verify the text for the intro sentence of the cookies page
  const cookiesIntro = page.locator('#cookies-intro');
  await expect(cookiesIntro).toHaveText('Cookies are small files saved on your phone, tablet or computer when you visit a website.');

  // Verify the text for the info about how cookies are used
  const mccCookie = page.locator('#mcc-cookie');
  await expect(mccCookie).toHaveText('Manage your civil cases uses a cookie across the service to remember your answers.');
  
  // Verify the text for how to manage cookies from the ICO
  const icoInfo = page.locator('#icoInfo');
  await expect(icoInfo).toHaveText("Find out how to manage cookies from the Information Commissioner's Office.");

  // Check for the subheading on the cookies page
  await expect(page.getByRole('heading', { level: 2, name: t('pages.cookies.subheading') })).toBeVisible();

  // Verify the text for the subheading on the cookies page
  const cookiesSubheading = page.locator('#cookies-subheading')
  await expect(cookiesSubheading).toHaveText('Essential cookies (strictly necessary)');

  // Verify the text for how info on how essential cookie is used
  const essentialInfo = page.locator('#essential-info')
  await expect(essentialInfo).toHaveText('We use an essential cookie to remember your answers as you use the service.');
  
  // Check the table is visible
  const table = page.getByRole('table');
  await expect(table).toBeVisible();

  // Verify the text for the table caption
  await expect(page.getByText('Essential cookies we use'))

  // Verify the text for the column headers on table
  await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Purpose' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Expires' })).toBeVisible();

  // Check that only one row is visible
  const rows = page.locator('tbody tr');
  await expect(rows).toHaveCount(1);

  // Verify the text for the row on table
  await expect(page.getByText('sessionID')).toBeVisible();
  await expect(page.getByText('Stores user-provided form data')).toBeVisible();
  await expect(page.getByText('24 hours')).toBeVisible();

});

test('cookies link goes to ICO site', async ({ page }) => {
  // Navigate to the search page
  await page.goto(visitUrl);

  // Check link to ICO works
  const link = page.locator('a[href="https://ico.org.uk/for-the-public/online/cookies"]');
  await expect(link).toBeVisible();
  await Promise.all([page.waitForURL(/ico\.org\.uk/), link.click(),]);
  await expect(page).toHaveURL(/ico\.org\.uk/);
});