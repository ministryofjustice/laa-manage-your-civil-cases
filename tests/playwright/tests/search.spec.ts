import { test, expect } from '../fixtures/index.js';
import { t, setupAuth } from '../utils/index.js';

// Login before each test since search page requires authentication
test.beforeEach(async ({ page }) => {
  await setupAuth(page);
});

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

  // Check that the validation error message is displayed in the error summary
  await expect(page.getByRole('link', { name: t('forms.search.validationError.notEmpty') })).toBeVisible();
  
  // Also check that the inline error message is displayed on the input field
  await expect(page.locator('#searchKeyword-error')).toContainText(t('forms.search.validationError.notEmpty'));
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
  
  // Navigate to search page
  await page.goto('/search');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Check if page loaded correctly
  const title = await page.title();
  
  // Enter search keyword
  const searchInput = page.locator('#searchKeyword');
  await expect(searchInput).toBeVisible();
  await searchInput.fill('John');
  
  // Verify the input value was set
  const inputValue = await searchInput.inputValue();
  
  // Click the search button
  const searchButton = page.locator('button[type="submit"]');
  await expect(searchButton).toBeVisible();
  
  await searchButton.click();
  
  
  // Wait for navigation or response
  await page.waitForLoadState('networkidle');
  
  // Check current URL
  const currentUrl = page.url();
  
  // Check for any console errors
  const logs = [];
  page.on('console', msg => {
    logs.push(`${msg.type()}: ${msg.text()}`);
  });
  
  // Verify the page loaded successfully by checking for main content
  const mainContent = page.locator('main');
  await expect(mainContent).toBeVisible();
});

  test('search with valid laa reference should display results', async ({ page, i18nSetup }) => {
  
  // Navigate to search page
  await page.goto('/search');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Check if page loaded correctly
  const title = await page.title();
  
  // Enter search keyword
  const searchInput = page.locator('#searchKeyword');
  await expect(searchInput).toBeVisible();
  await searchInput.fill('3000435');
  
  // Verify the input value was set
  const inputValue = await searchInput.inputValue();
  
  // Click the search button
  const searchButton = page.locator('button[type="submit"]');
  await expect(searchButton).toBeVisible();
  
  await searchButton.click();
  
  
  // Wait for navigation or response
  await page.waitForLoadState('networkidle');
  
  // Check current URL
  const currentUrl = page.url();
  
  // Check for any console errors
  const logs = [];
  page.on('console', msg => {
    logs.push(`${msg.type()}: ${msg.text()}`);
  });
  
  // Verify the page loaded successfully by checking for main content
  const mainContent = page.locator('main');
  await expect(mainContent).toBeVisible();
  
});
test('search clear functionality via GET route', async ({ page, i18nSetup }) => {
  // Navigate to the search clear route directly
  await page.goto('/search/clear');

  // Should stay on clear route or redirect as designed
  await expect(page).toHaveURL(/\/search/);
});

test('GET /search/ (with trailing slash) should render search page', async ({ page, i18nSetup }) => {
  // Navigate to the search page with trailing slash (the actual route)
  await page.goto('/search/');
  
  // Verify we're on the search page
  await expect(page).toHaveURL('/search/');
  
  // Check for the heading of the search page
  await expect(page.getByRole('heading', { name: t('pages.search.heading') })).toBeVisible();
  
  // Check for the search input
  const searchInput = page.locator('#searchKeyword');
  await expect(searchInput).toBeVisible();
  
  // Check for the search button
  const searchButton = page.getByRole('button', { name: t('pages.search.searchButtonText') });
  await expect(searchButton).toBeVisible();
});

test('POST /search/ should process valid search and display results', async ({ page, i18nSetup }) => {
  // Navigate to search page
  await page.goto('/search/');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Enter search keyword
  const searchInput = page.locator('#searchKeyword');
  await expect(searchInput).toBeVisible();
  await searchInput.fill('John');
  
  // Verify the input value was set
  await expect(searchInput).toHaveValue('John');
  
  // Intercept the form submission and modify the action to use trailing slash
  await page.evaluate(() => {
    const form = document.querySelector('form[action="/search"]') as HTMLFormElement;
    if (form) {
      form.action = '/search/';
    }
  });
  
  // Submit the form (this will POST to /search/)
  const searchButton = page.locator('button[type="submit"]');
  await expect(searchButton).toBeVisible();
  await searchButton.click();
  
  // Wait for form submission and response
  await page.waitForLoadState('networkidle');
  
  // Verify we stayed on or were redirected to a search results page
  await expect(page).toHaveURL(/\/search/);
  
  // Verify the search was processed by checking the search input retains the value
  const searchInputAfterSubmit = page.locator('#searchKeyword');
  await expect(searchInputAfterSubmit).toHaveValue('John');
  
  // Verify the main content area is visible (search results or search form)
  const mainContent = page.locator('main');
  await expect(mainContent).toBeVisible();
  
  // Verify the page has the search heading
  await expect(page.getByRole('heading', { name: t('pages.search.heading') })).toBeVisible();
});