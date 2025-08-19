import { test, expect } from '@playwright/test';

test('MSW debugging - step by step verification', async ({ page }) => {
  console.log('🔍 Step 1: Testing MSW health check endpoint...');
  
  // Navigate to our MSW test endpoint
  await page.goto('/test-msw');
  
  // Get the JSON response
  const content = await page.textContent('body');
  console.log('📝 Raw response:', content);
  
  // Parse the response
  const response = JSON.parse(content || '{}');
  
  console.log('🔍 Step 2: Checking if MSW is intercepting...');
  console.log('Response success:', response.success);
  console.log('MSW response:', response.mswResponse);
  
  // Verify MSW is working
  expect(response.success).toBe(true);
  expect(response.mswResponse).toHaveProperty('status', 'MSW is working!');
  expect(response.mswResponse).toHaveProperty('message', 'This response proves MSW is active');
  
  console.log('✅ MSW is successfully intercepting API calls!');
});
