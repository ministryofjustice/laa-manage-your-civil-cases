import { test, expect } from '@playwright/test';

test('MSW intercepts real API calls and displays mock data', async ({ page }) => {
  console.log('🔍 Testing MSW with real application route...');
  
  // Navigate to a real case details page that triggers apiService.getClientDetails
  await page.goto('/cases/PC-1922-1879/client-details');
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  
  // Check that the page loaded successfully (not an error page)
  const pageContent = await page.textContent('body');
  console.log('📝 Page content length:', pageContent?.length);
  
  // Verify that we got a successful page load (not 404 or error)
  expect(pageContent).not.toContain('404');
  expect(pageContent).not.toContain('The requested information could not be found');
  console.log('✅ Page loaded successfully (no 404 error)');
  
  // Verify the case reference is correct
  expect(pageContent).toContain('PC-1922-1879');
  console.log('✅ Case reference verified: PC-1922-1879');
  
  // Now verify MSW mock data is displayed
  console.log('🔍 Checking for MSW mock data on the page...');
  
  // Look for the mock client name somewhere on the page
  if (pageContent?.includes('MSW Test Client')) {
    console.log('✅ Mock client name found: MSW Test Client');
  } else {
    console.log('❌ Mock client name NOT found. MSW may not be intercepting correctly.');
    console.log('📄 Page content preview:', pageContent?.substring(0, 500));
  }
  
  expect(pageContent).toContain('MSW Test Client');
  console.log('🎉 SUCCESS: MSW intercepted API calls and mock data is displayed!');
});
