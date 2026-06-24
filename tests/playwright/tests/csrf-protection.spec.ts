import { test, expect } from '../fixtures/index.js';
import { setupAuth } from '../utils/index.js';

const CASE_REFERENCE = 'PC-6667-9089';

test.describe('CSRF Protection', () => {
  test('feedback form should include CSRF token in hidden input', async ({ page, i18nSetup }) => {
    await setupAuth(page);
    await page.goto(`/cases/${CASE_REFERENCE}/do-you-want-to-give-feedback`);

    // Check for CSRF token hidden input
    const csrfInput = page.locator('input[name="_csrf"]');
    await expect(csrfInput).toBeAttached();
    await expect(csrfInput).toHaveAttribute('type', 'hidden');

    // Verify token has a value
    const csrfValue = await csrfInput.getAttribute('value');
    expect(csrfValue).toBeTruthy();
    expect(csrfValue).not.toBe('');
  });

  test('feedback form should include CSRF token in meta tag', async ({ page, i18nSetup }) => {
    await setupAuth(page);
    await page.goto(`/cases/${CASE_REFERENCE}/do-you-want-to-give-feedback`);

    // Check for CSRF token meta tag
    const csrfMeta = page.locator('meta[name="csrf-token"]');
    await expect(csrfMeta).toBeAttached();

    // Verify token has a value
    const csrfValue = await csrfMeta.getAttribute('content');
    expect(csrfValue).toBeTruthy();
    expect(csrfValue).not.toBe('');
  });

  test('feedback form should include CSRF token', async ({ page, i18nSetup }) => {
    await setupAuth(page);
    await page.goto(`/cases/${CASE_REFERENCE}/do-you-want-to-give-feedback`);

    const csrfInput = page.locator('input[name="_csrf"]');
    await expect(csrfInput).toBeAttached();
    await expect(csrfInput).toHaveAttribute('type', 'hidden');

    const csrfValue = await csrfInput.getAttribute('value');
    expect(csrfValue).toBeTruthy();
  });

  test('session cookies should have secure attributes', async ({ page, i18nSetup, pages, context }) => {
    await pages.login.login();

    // Get cookies
    const cookies = await context.cookies();

    // Find session cookie (adjust name based on your SESSION_NAME env var)
    const sessionCookie = cookies.find(c =>
      c.name.includes('session') || c.name.includes('connect.sid')
    );

    if (sessionCookie) {
      // Verify HttpOnly flag (prevents XSS)
      expect(sessionCookie.httpOnly).toBe(true);

      // Verify SameSite attribute (CSRF protection)
      expect(sessionCookie.sameSite).toBe('Lax');
    }
  });

  test('GET requests should not require CSRF validation', async ({ page, i18nSetup }) => {
    await setupAuth(page);
    // GET request to cases page should work without CSRF token concerns
    await page.goto('/cases/new');
    // Should successfully load
    await expect(page).toHaveURL(/\/cases\/new/);
    // Page should load without errors
    await expect(page.locator('h1')).toBeVisible();
  });

  test('POST request should validate CSRF token', async ({ page, i18nSetup }) => {
    await setupAuth(page);
    await page.goto(`/cases/${CASE_REFERENCE}/do-you-want-to-give-feedback`);

    // Verify CSRF token exists before manipulation
    const csrfInput = page.locator('input[name="_csrf"]');
    await expect(csrfInput).toBeAttached();

    // Select a radio option
    await page.check('input[value="true"]');

    // Remove CSRF token
    await page.evaluate(() => {
      const input = document.querySelector('input[name="_csrf"]') as HTMLInputElement;
      if (input) input.remove();
    });

    // Submit form
    await page.click('button[type="submit"]');

    // Should not succeed - should show error or stay on page
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    expect(currentUrl).not.toMatch(/give-operator-feedback/);
  });

  test('CSRF token should remain consistent within same session', async ({ page, i18nSetup }) => {
    await setupAuth(page);

    // First visit
    await page.goto(`/cases/${CASE_REFERENCE}/do-you-want-to-give-feedback`);
    const firstToken = await page.locator('input[name="_csrf"]').getAttribute('value');

    // Second visit (same session)
    await page.goto(`/cases/${CASE_REFERENCE}/do-you-want-to-give-feedback`);
    const secondToken = await page.locator('input[name="_csrf"]').getAttribute('value');

    // Token should be the same within the same session
    expect(firstToken).toBe(secondToken);
  });
});
