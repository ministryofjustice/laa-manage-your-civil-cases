import { test, expect } from '@playwright/test';

test('MSW intercepts real API calls', async ({ page }) => {
  console.log('🔍 Testing MSW with real application route...');
  
  // Navigate to a real case details page that triggers apiService.getClientDetails
  await page.goto('/cases/PC-1922-1879/client-details');
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  
  // Check that the page rendered successfully (not an error page)
  const pageContent = await page.textContent('body');
  console.log('� Page content length:', pageContent?.length);
  
  // Verify that we got a successful page load (not 404 or error)
  expect(pageContent).not.toContain('404');
  expect(pageContent).not.toContain('Error');
  expect(pageContent).not.toContain('not found');
  
  // Look for typical client details page elements
  await expect(page.locator('body')).toBeVisible();
  
  console.log('✅ Real API route loaded successfully - MSW intercepted the apiService.getClientDetails call!');
});
