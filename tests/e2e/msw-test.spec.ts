import { test, expect } from '@playwright/test';

test('MSW intercepts real API calls and displays mock data', async ({ page }) => {
  console.log('🔍 Testing MSW with real application route...');
  
  // Navigate to a real case details page that triggers apiService.getClientDetails
  await page.goto('/cases/PC-1922-1879/client-details');
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  
  // Check that the page rendered successfully (not an error page)
  const pageContent = await page.textContent('body');
  console.log('📝 Page content length:', pageContent?.length);
  
  // Verify that we got a successful page load (not 404 or error)
  expect(pageContent).not.toContain('404');
  expect(pageContent).not.toContain('Error');
  expect(pageContent).not.toContain('not found');
  
  // ✨ NEW: Verify that MSW mock data is actually displayed on the page
  // These values come from our MSW handler in tests/e2e/mocks/handlers/api.ts
  console.log('🔍 Checking for MSW mock data on the page...');
  
  // Check for the mock client name
  await expect(page.locator('body')).toContainText('MSW Test Client');
  console.log('✅ Mock client name found: MSW Test Client');
  
  // Check for the mock phone number
  await expect(page.locator('body')).toContainText('+44 7700 900123');
  console.log('✅ Mock phone number found: +44 7700 900123');
  
  // Check for the mock email address
  await expect(page.locator('body')).toContainText('msw.test@example.com');
  console.log('✅ Mock email found: msw.test@example.com');
  
  // Check for the mock address
  await expect(page.locator('body')).toContainText('123 MSW Test Street');
  console.log('✅ Mock address found: 123 MSW Test Street');
  
  // Check for the mock postcode
  await expect(page.locator('body')).toContainText('MSW 123');
  console.log('✅ Mock postcode found: MSW 123');
  
  // Verify the case reference is still correct
  expect(pageContent).toContain('PC-1922-1879');
  console.log('✅ Case reference verified: PC-1922-1879');
  
  console.log('🎉 SUCCESS: MSW intercepted apiService.getClientDetails and mock data is displayed!');
});
