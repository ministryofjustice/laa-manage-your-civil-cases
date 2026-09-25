import { test, expect } from '../fixtures/index.js';
import { setupAuth } from '../utils/index.js';
import { HTTP } from '#src/services/api/base/constants.js';

test.describe('main/error.njk', () => {
  test('renders the 404 page for an unknown route', async ({ page }) => {
    const response = await page.goto('/not-a-real-route');

    expect(response?.status()).toBe(HTTP.NOT_FOUND);
    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
    await expect(page.getByRole('link', { name: /help/i })).toHaveAttribute('href', '/help');
  });

  test('renders the bespoke authentication error for an invalid callback', async ({ page }) => {
    const response = await page.goto('/auth/callback');

    expect(response?.status()).toBe(HTTP.BAD_REQUEST);
    await expect(page.getByRole('heading', {level: 1, name: 'Sorry, there is a problem with the service' })).toBeVisible();
    await expect(page.getByText('tell us there was a problem signing you in')).toBeVisible();
  });

  // Uses middleware path in `caseDetailsMiddleware.ts`, which calls validCaseReference() and renders the generic 400 branch in error.njk
  test('renders the generic 400 page for an invalid case reference', async ({ page }) => {
    await setupAuth(page);

    const response = await page.goto('/cases/%20/client-details');

    expect(response?.status()).toBe(HTTP.BAD_REQUEST);
    await expect(page.getByRole('heading', {level: 1, name: 'There was a problem loading this page' })).toBeVisible();
    await expect(page.getByText('Refresh the page and try again.')).toBeVisible();
  });
});


