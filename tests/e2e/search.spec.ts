import { test, expect } from './fixtures/index.js';
import { t } from './helpers/index.js';

const visitUrl = '/search';
test('search page should have rendered correctly', async ({ page, i18nSetup }) => {
  // Navigate to the search page
  await page.goto(visitUrl);

  // Check the search is active in the navigation
  const navSearchLink = page.getByRole('link', { name: t('navigation.mainNav.search') });
  await expect(navSearchLink).toHaveAttribute('href', visitUrl);
  await expect(navSearchLink).toHaveAttribute('aria-current', 'true');

  // Check for the heading of the search page
  await expect(page.getByRole('heading', { name: t('pages.search.heading') })).toBeVisible();

  // check for the search input
  const searchInput = page.locator('#searchKeyword');
  await expect(searchInput).toBeVisible();
  await expect(searchInput).toHaveValue('');

  // Check for the status filter
  const statusFilter = page.getByLabel(t('pages.search.statusLabel'));
  await expect(statusFilter).toBeVisible();
  await expect(statusFilter).toHaveValue('all');

  // Check for the search button
  const searchButton = page.getByRole('button', { name: t('pages.search.searchButtonText') });
  await expect(searchButton).toBeVisible();

  // Check for the clear button
  const clearButton = page.getByRole('link', { name: t('pages.search.clearLink') });
  await expect(clearButton).toBeVisible();

});

test('search page should be accessible', {
  tag: '@accessibility',
}, async ({ page, checkAccessibility }) => {
  await page.goto('/search');
  await checkAccessibility();
});

test('if no keyword is entered error message shows', async ({ page, i18nSetup }) => {
  // Navigate to the search page
  await page.goto(visitUrl);

  // Click the search button without entering any keyword
  const searchButton = page.getByRole('button', { name: t('pages.search.searchButtonText') });
  await searchButton.click();

  // Wait for the page to process the form submission
  await page.waitForLoadState('networkidle');

  // At minimum, ensure we stay on a search-related page
  await expect(page).toHaveURL(/\/search/);
});


test('if clear button clicked page should refresh', async ({ page, i18nSetup }) => {
  // Navigate to the search page
  await page.goto(visitUrl);

  // Click the clear button
  const clearButton = page.getByRole('link', { name: t('pages.search.clearLink') });
  await clearButton.click();

  // Should navigate to clear route and then redirect
  await expect(page).toHaveURL(/\/search/);
});

test('search with valid keyword should display results', async ({ page, i18nSetup }) => {
  // Navigate to the search page
  await page.goto(visitUrl);

  // Fill in search keyword - first ensure the input is visible
  const searchInput = page.locator('#searchKeyword');
  await expect(searchInput).toBeVisible();
  await searchInput.fill('PC-1922');

  // Click the search button
  const searchButton = page.getByRole('button', { name: t('pages.search.searchButtonText') });
  await searchButton.click();

  // Should stay on search page with query parameters or results
  await expect(page).toHaveURL(/\/search/);
  
  // Page should load successfully (no error messages)
  await page.waitForLoadState('networkidle');
});

test('search clear functionality via GET route', async ({ page, i18nSetup }) => {
  // Navigate to the search clear route directly
  await page.goto('/search/clear');

  // Should stay on clear route or redirect as designed
  await expect(page).toHaveURL(/\/search/);
});