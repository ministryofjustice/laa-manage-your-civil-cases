/**
 * Authentication Helper for Playwright Tests
 * 
 * Provides utilities to authenticate test users and manage sessions
 * during E2E tests with Playwright.
 */

import type { Page } from '@playwright/test';

/**
 * Test user credentials
 * These credentials work with the MSW mock server in tests
 */
export const TEST_USER = {
  username: 'test-user@example.com',
  password: 'test-password-123'
} as const;

/**
 * Login to the application using the test user credentials
 * 
 * This function navigates to the login page, fills in the credentials,
 * submits the form, and waits for successful authentication.
 * 
 * @param {Page} page - Playwright page object
 * @param {object} credentials - Optional custom credentials
 * @param {string} credentials.username - Username/email
 * @param {string} credentials.password - Password
 * @returns {Promise<void>}
 * 
 * @example
 * test('should access protected page', async ({ page }) => {
 *   await login(page);
 *   await page.goto('/cases/new');
 *   // ... rest of test
 * });
 */
export async function login(
  page: Page,
  credentials: { username: string; password: string } = TEST_USER
): Promise<void> {
  // Navigate to login page
  await page.goto('/login');

  // Wait for login form to be visible
  await page.waitForSelector('#username');

  // Fill in credentials
  await page.fill('#username', credentials.username);
  await page.fill('#password', credentials.password);

  // Submit the form
  await page.click('button[type="submit"]');

  // Wait for navigation away from login page (successful authentication)
  // The app should redirect to /cases or similar after successful login
  await page.waitForURL((url) => !url.pathname.includes('/login'), {
    timeout: 10000
  });
}

/**
 * Login and navigate to a specific page
 * 
 * Convenience function that logs in and then navigates to a specific URL.
 * 
 * @param {Page} page - Playwright page object
 * @param {string} url - URL to navigate to after login
 * @param {object} credentials - Optional custom credentials
 * @returns {Promise<void>}
 * 
 * @example
 * test('should view case details', async ({ page }) => {
 *   await loginAndNavigate(page, '/cases/PC-1234-5678/client-details');
 *   await expect(page.locator('h1')).toContainText('Client details');
 * });
 */
export async function loginAndNavigate(
  page: Page,
  url: string,
  credentials: { username: string; password: string } = TEST_USER
): Promise<void> {
  await login(page, credentials);
  await page.goto(url);
}

/**
 * Check if user is currently authenticated
 * 
 * Checks if the current page is the login page or if there's a valid session.
 * 
 * @param {Page} page - Playwright page object
 * @returns {Promise<boolean>} True if authenticated, false otherwise
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const currentUrl = page.url();
  return !currentUrl.includes('/login');
}

/**
 * Logout from the application
 * 
 * Logs out the current user by clearing cookies and navigating to logout endpoint.
 * 
 * @param {Page} page - Playwright page object
 * @returns {Promise<void>}
 */
export async function logout(page: Page): Promise<void> {
  // Clear all cookies (including session cookie)
  await page.context().clearCookies();
  
  // Navigate to logout endpoint if it exists, or just go to login page
  await page.goto('/login');
}

/**
 * Setup authentication for all tests in a suite
 * 
 * This is a convenience function to be used in test.beforeEach() hooks.
 * It ensures the user is logged in before each test runs.
 * 
 * @param {Page} page - Playwright page object
 * @returns {Promise<void>}
 * 
 * @example
 * test.describe('Case management', () => {
 *   test.beforeEach(async ({ page }) => {
 *     await setupAuth(page);
 *   });
 * 
 *   test('should list cases', async ({ page }) => {
 *     await page.goto('/cases/new');
 *     // ... test code
 *   });
 * });
 */
export async function setupAuth(page: Page): Promise<void> {
  // Always perform login - simple and reliable
  // Each test gets a fresh context, so we need to login every time
  await login(page);
}
