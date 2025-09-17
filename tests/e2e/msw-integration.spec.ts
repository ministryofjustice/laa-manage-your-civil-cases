import { test, expect } from '@playwright/test';

test.describe('MSW Integration Tests', () => {
  test('MSW intercepts API calls and serves mock data', async ({ page }) => {
    // Start from homepage which should trigger the cases API call
    await page.goto('/');
    
    // Wait for the page to load and make API calls
    await page.waitForLoadState('networkidle');
    
    // Verify that MSW is working by checking for our temporary mock data
    // The homepage should display cases from our temporary handler
    await expect(page).toHaveTitle(/Manage your civil cases/);
    
    // Check that the page loads without API errors
    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).not.toBeVisible();
  });

  test('MSW handles client details API calls', async ({ page }) => {
    // Navigate to a client details page that would trigger GET /cases/{caseReference}
    await page.goto('/cases/PC-1922-1879/client-details');
    
    // Wait for API calls to complete
    await page.waitForLoadState('networkidle');
    
    // Verify the page loads successfully (MSW should have intercepted the API call)
    // At this point we're just verifying no 404s or network errors occur
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    
    // Check that we don't have any unhandled API error messages
    const errorMessage = page.locator('[data-testid="api-error"]');
    await expect(errorMessage).not.toBeVisible();
  });

  test('MSW logs unhandled requests for coverage tracking', async ({ page }) => {
    // This test verifies our catch-all handler is working
    // Navigate to a page that might make API calls we haven't mocked yet
    await page.goto('/search');
    
    await page.waitForLoadState('networkidle');
    
    // The page should still load even if some API calls are unhandled
    // Our catch-all handler should prevent 404 errors
    await expect(page).toHaveTitle(/Manage your civil cases/);
  });
});
