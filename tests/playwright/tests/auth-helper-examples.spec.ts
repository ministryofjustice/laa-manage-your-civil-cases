/**
 * Example: Using Authentication Helper in Playwright Tests
 * 
 * This file demonstrates different patterns for using the auth helper
 * in your Playwright tests.
 */

import { test, expect } from '@playwright/test';
import { login, loginAndNavigate, setupAuth } from '../utils/auth.js';
import { initI18nSync, t } from '../utils/i18n.js';

// Initialize i18n for translation helpers
test.beforeEach(({ page }) => {
  const i18nSetup = initI18nSync();
  return i18nSetup;
});

/**
 * PATTERN 1: Manual login in each test
 * Use this when you need fine control over the login process
 */
test.describe('Pattern 1: Manual login', () => {
  test('should access new cases page after login', async ({ page }) => {
    // Login first
    await login(page);
    
    // Then navigate to protected page
    await page.goto('/cases/new');
    
    // Verify we can access the page
    await expect(page.locator('h1')).toContainText('New cases');
  });
});

/**
 * PATTERN 2: Login and navigate in one step
 * Use this when you want to go directly to a specific page
 */
test.describe('Pattern 2: Login and navigate', () => {
  test('should access case details page', async ({ page }) => {
    // Login and go directly to the page you need
    await loginAndNavigate(page, '/cases/PC-1922-1879/client-details');
    
    // Verify page loaded
    await expect(page).toHaveURL(/\/cases\/PC-1922-1879\/client-details/);
  });
});

/**
 * PATTERN 3: Setup auth in beforeEach (RECOMMENDED)
 * Use this for test suites where all tests need authentication
 */
test.describe('Pattern 3: Setup auth in beforeEach', () => {
  // Login before each test in this suite
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test('should view new cases', async ({ page }) => {
    await page.goto('/cases/new');
    await expect(page.locator('h1')).toContainText('New cases');
  });

  test('should view opened cases', async ({ page }) => {
    await page.goto('/cases/opened');
    await expect(page.locator('h1')).toContainText('Opened cases');
  });

  test('should view accepted cases', async ({ page }) => {
    await page.goto('/cases/accepted');
    await expect(page.locator('h1')).toContainText('Accepted cases');
  });
});

/**
 * PATTERN 4: Tests that don't need auth
 * Some tests check public pages or the login page itself
 */
test.describe('Pattern 4: No auth needed', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toContainText('Sign in to Manage your civil cases');
  });

  test('should access health endpoint', async ({ page }) => {
    const response = await page.goto('/health');
    expect(response?.status()).toBe(200);
  });
});
