/**
 * Authentication Helper for Playwright Tests
 * Uses the playwright only `/auth/test-session` endpoint to create a valid SiLAS session directly.
 * This bypasses the OAuth2/Entra redirect flow.
 */

import type { Page } from '@playwright/test';

/**
 * Creates an authenticated session via `/auth/test-session` endpoint and waits until
 * the server redirects to `/cases/new`, confirming the session was saved.
 * @param {Page} page - Playwright page object
 * @returns {Promise<void>}
 */
export async function login(page: Page): Promise<void> {
  await page.goto('/auth/test-session');
  await page.waitForURL((url) => url.pathname.startsWith('/cases'), { timeout: 10000 });
}

/**
 * Creates an authenticated session then navigates to a specific URL.
 * @param {Page} page - Playwright page object
 * @param {string} url - URL to navigate to after login
 * @returns {Promise<void>}
 *
 * @example
 * test('should view case details', async ({ page }) => {
 *   await loginAndNavigate(page, '/cases/PC-1234-5678/client-details');
 *   await expect(page.locator('h1')).toContainText('Client details');
 * });
 */
export async function loginAndNavigate(page: Page, url: string): Promise<void> {
  await login(page);
  await page.goto(url);
}

/**
 * Returns true if the current URL is not the `auth/login` page.
 * @param {Page} page - Playwright page object
 * @returns {Promise<boolean>}
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  return !page.url().includes('/auth');
}

/**
 * Clears the session and navigates to the `/auth` route.
 * @param {Page} page - Playwright page object
 * @returns {Promise<void>}
 */
export async function logout(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.goto('/auth');
}

/**
 * Convenience wrapper for use in `test.beforeEach()` hooks.
 * @param {Page} page - Playwright page object
 * @returns {Promise<void>}
 */
export async function setupAuth(page: Page): Promise<void> {
  await login(page);
}
