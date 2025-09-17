import { test, expect } from './fixtures/index.js';

test('health endpoint should return 200 OK', async ({ page, i18nSetup }) => {
  // Navigate to the health endpoint
  const response = await page.goto('/health');
  
  // Check that the health endpoint returns 200
  expect(response?.status()).toBe(200);
  
  // Check that it returns some content (might be "Healthy" or similar)
  const content = await page.textContent('body');
  expect(content).toBeTruthy();
});

test('status endpoint should return 200 OK', async ({ page, i18nSetup }) => {
  // Navigate to the status endpoint  
  const response = await page.goto('/status');
  
  // Check that the status endpoint returns 200
  expect(response?.status()).toBe(200);
  
  // Check that it returns some content
  const content = await page.textContent('body');
  expect(content).toBeTruthy();
});