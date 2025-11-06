/**
 * Example: Using Authentication Helper in Playwright Tests
 * 
 * This file demonstrates how to use the auth helper in your Playwright tests.
 */

import { test, expect } from '@playwright/test';
import { setupAuth } from '../utils/auth.js';
import { initI18nSync, t } from '../utils/i18n.js';

// Initialize i18n for translation helpers
test.beforeEach(({ page }) => {
  const i18nSetup = initI18nSync();
  return i18nSetup;
});

/**
 * Setup auth in beforeEach
 */
test.describe('Setup auth in beforeEach', () => {
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
 * Tests that don't need auth
 * Some tests check public pages or the login page itself
 */
test.describe('No auth needed', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toContainText('Sign in to Manage your civil cases');
  });

  test('should access health endpoint', async ({ page }) => {
    const response = await page.goto('/health');
    expect(response?.status()).toBe(200);
  });
});
