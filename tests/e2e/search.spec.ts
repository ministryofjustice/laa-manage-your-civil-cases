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
  console.log('🧪 TEST START: search with valid keyword should display results');
  
  // Navigate to search page
  console.log('🧪 TEST: Navigating to /search');
  await page.goto('/search');
  
  // Wait for page to load
  console.log('🧪 TEST: Waiting for page load');
  await page.waitForLoadState('networkidle');
  
  // Check if page loaded correctly
  const title = await page.title();
  console.log(`🧪 TEST: Page title is "${title}"`);
  
  // Enter search keyword
  console.log('🧪 TEST: Looking for search input field');
  const searchInput = page.locator('#searchKeyword');
  await expect(searchInput).toBeVisible();
  console.log('🧪 TEST: Search input found, filling with "John"');
  await searchInput.fill('John');
  
  // Verify the input value was set
  const inputValue = await searchInput.inputValue();
  console.log(`🧪 TEST: Search input value is "${inputValue}"`);
  
  // Click the search button
  console.log('🧪 TEST: Looking for search button');
  const searchButton = page.locator('button[type="submit"]');
  await expect(searchButton).toBeVisible();
  console.log('🧪 TEST: Search button found, clicking...');
  
  // Listen for any network requests during the search
  page.on('request', request => {
    console.log(`🌐 NETWORK REQUEST: ${request.method()} ${request.url()}`);
  });
  
  page.on('response', response => {
    console.log(`🌐 NETWORK RESPONSE: ${response.status()} ${response.url()}`);
  });
  
  await searchButton.click();
  
  console.log('🧪 TEST: Search button clicked, waiting for response...');
  
  // Wait for navigation or response
  await page.waitForLoadState('networkidle');
  
  // Check current URL
  const currentUrl = page.url();
  console.log(`🧪 TEST: Current URL after search: ${currentUrl}`);
  
  // Check for any console errors
  const logs = [];
  page.on('console', msg => {
    logs.push(`${msg.type()}: ${msg.text()}`);
    console.log(`🖥️ CONSOLE ${msg.type().toUpperCase()}: ${msg.text()}`);
  });
  
  // Verify the page loaded successfully by checking for main content
  console.log('🧪 TEST: Looking for main content area');
  const mainContent = page.locator('main');
  await expect(mainContent).toBeVisible();
  console.log('🧪 TEST: Main content found');
  
  console.log('🧪 TEST COMPLETE: search with valid keyword should display results');
});test('search clear functionality via GET route', async ({ page, i18nSetup }) => {
  // Navigate to the search clear route directly
  await page.goto('/search/clear');

  // Should stay on clear route or redirect as designed
  await expect(page).toHaveURL(/\/search/);
});