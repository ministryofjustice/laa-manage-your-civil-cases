import { test, expect } from '../fixtures/index.js';
import { t, setupAuth } from '../utils/index.js'

test('cookies page has correct title header', async ({ page, i18nSetup }) => {
  // Navigate to the homepage
  await page.goto('/cookies');

  // Check for the title of the application
  await expect(page).toHaveTitle(/.*Manage your civil cases.*/);
});

test('cookies page should display LAA header', async ({ page, i18nSetup }) => {
  // Navigate to the homepage
  await page.goto('/cookies');

  const header = page.getByRole('banner');

  // Check for the header with LAA branding
  await expect(header).toBeVisible();
});

test('cookies page should display phase banner with hello content', async ({ page, i18nSetup }) => {
  // Navigate to the homepage
  await page.goto('/cookies');

  // Target the phase banner
  const phaseBanner = page.locator('.govuk-phase-banner');

  // Check if the phase banner is visible
  await expect(phaseBanner).toBeVisible();

  // Check if feedback link text is in the phase banner
  await expect(phaseBanner).toContainText(t('components.phaseBanner.feedbackText'));
});

test('footer is visible with expected links', async ({ page }) => {  
  await page.goto('/cookies');

  const footer = page.locator('.govuk-footer');
  await expect(footer).toBeVisible();
  await expect(footer.getByRole('link', { name: 'Help' })).toBeVisible();
  await expect(footer.getByRole('link', { name: 'Feedback' })).toBeVisible();
  await expect(footer.getByRole('link', { name: 'Updates' })).toBeVisible();
  await expect(footer.getByRole('link', { name: 'Privacy Policy' })).toBeVisible();
  await expect(footer.getByRole('link', { name: 'Cookies' })).toBeVisible();
  await expect(footer.getByRole('link', { name: 'Accessibility' })).toBeVisible();
});

const visitUrl = '/cookies';
test('cookies page should have rendered correctly', async ({ page, i18nSetup }) => {
  // Navigate to the search page
  await page.goto(visitUrl);
  
  // Check nav bar exists
  const nav = page.locator('.govuk-service-navigation');
  await expect(nav).toBeVisible();

  // Check service name is visible in the navigation section of the screen
  await expect(nav).toContainText('Manage your civil cases');

  // Check the links are not in the nav bar
  await expect(page.getByRole('link', { name: 'Your cases' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Search' })).toHaveCount(0);

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
  const icoInfo = page.locator('#ico-info');
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

test('nav links are hidden on cookies page when logged in', async ({ page }) => {
  await setupAuth(page);
  await page.goto('/');
  // navigate like a real user to cookie page
  await page.getByRole('link', { name: 'Cookies' }).click();
  
  // assert we are on cookies page
  await expect(page).toHaveURL(/cookies/);

  // Check nav bar exists
  const nav = page.locator('.govuk-service-navigation');
  await expect(nav).toBeVisible();

  // Check service name is visible in the navigation section of the screen
  await expect(nav).toContainText('Manage your civil cases');

  // Check the links are not in the nav bar
  await expect(page.getByRole('link', { name: 'Your cases' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Search' })).toHaveCount(0);
});

test('cookies page can be accessed after signing out', async ({ page }) => {
  await setupAuth(page);
  await page.goto('/');

  // Sign out
  await page.getByRole('link', { name: 'Sign out' }).click();

  // Navigate to cookies page
  await page.goto('/cookies');

  // Verify user is on the cookies page
  await expect(page).toHaveURL(/cookies/);

  // Verify the cookies page heading is displayed
  await expect(page.getByRole('heading', { level: 1, name: t('pages.cookies.heading') })).toBeVisible();
});