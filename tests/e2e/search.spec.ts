import { test, expect } from '@playwright/test';


test('search page should have rendered correctly', async ({ page }) => {
  // Navigate to the search page
  await page.goto('/search');

  // Check the search is active in the navigation
  const navSearchLink = page.getByRole('link', { name: 'Search' });
  await expect(navSearchLink).toHaveAttribute('href', '/search');
  await expect(navSearchLink).toHaveAttribute('aria-current', 'true');

  // Check for the heading of the search page
  await expect(page.getByRole('heading', { name: 'Search for a case' })).toBeVisible();

  // check for the search input
  const searchInput = page.locator('#searchKeyword');
  await expect(searchInput).toBeVisible();
  await expect(searchInput).toHaveValue('');

  // Check for the status filter
  const statusFilter = page.getByLabel('Status');
  await expect(statusFilter).toBeVisible();
  await expect(statusFilter).toHaveValue('all');

  // Check for the search button
  const searchButton = page.getByRole('button', { name: 'Search' });
  await expect(searchButton).toBeVisible();

  // Check for the clear button
  const clearButton = page.getByRole('link', { name: 'Clear all' });
  await expect(clearButton).toBeVisible();

});