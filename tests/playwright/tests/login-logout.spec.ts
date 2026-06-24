import { test, expect } from '../fixtures/index.js';

test.describe('Login and Logout Flow', () => {
  test('GET /auth should redirect to SiLAS (Entra)', async ({ page, i18nSetup }) => {
    const response = await page.goto('/auth');
    // SiLAS redirects to Entra and the final URL should no longer be `/auth`
    expect(page.url()).not.toMatch(/^http:\/\/localhost.*\/auth$/);
  });

  test('GET `/auth/test-session` should seed a valid session and redirect to cases', async ({ page, i18nSetup, pages }) => {
    // This is for the playwright authentication flow
    await pages.login.login();
    await expect(page).toHaveURL(/\/cases\/new/);
  });

  test('GET `/auth/logout` should clear session', async ({ page, i18nSetup, pages }) => {
    await pages.login.login();
    await page.goto('/auth/logout');

    // After logout the session is destroyed, so navigating to a protected route (`/cases/new`), should redirect back to `/auth`
    await page.goto('/cases/new');
    await expect(page).toHaveURL(/\/auth/);
  });
});
