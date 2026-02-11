import { test, expect } from '../fixtures/index.js';
import { setupAuth } from '../utils/index.js';

test.describe('CSRF Protection', () => {
  test('login page should include CSRF token in form', async ({ page, i18nSetup, pages }) => {
    const loginPage = pages.login;
    await loginPage.navigate();

    // Check for CSRF token hidden input
    const csrfInput = page.locator('input[name="_csrf"]');
    await expect(csrfInput).toBeAttached();
    await expect(csrfInput).toHaveAttribute('type', 'hidden');

    // Verify token has a value
    const csrfValue = await csrfInput.getAttribute('value');
    expect(csrfValue).toBeTruthy();
    expect(csrfValue).not.toBe('');
  });

  test('login page should include CSRF token in meta tag', async ({ page, i18nSetup, pages }) => {
    const loginPage = pages.login;
    await loginPage.navigate();

    // Check for CSRF token meta tag
    const csrfMeta = page.locator('meta[name="csrf-token"]');
    await expect(csrfMeta).toBeAttached();

    // Verify token has a value
    const csrfValue = await csrfMeta.getAttribute('content');
    expect(csrfValue).toBeTruthy();
    expect(csrfValue).not.toBe('');
  });

  test('login should fail when CSRF token is removed', async ({ page, i18nSetup, pages }) => {
    const loginPage = pages.login;
    await loginPage.navigate();

    // Fill in credentials
    await loginPage.fillCredentials('test-user', 'test-password');

    // Remove CSRF token using JavaScript
    await page.evaluate(() => {
      const csrfInput = document.querySelector('input[name="_csrf"]') as HTMLInputElement;
      if (csrfInput) {
        csrfInput.remove();
      }
    });

    // Attempt to submit
    await loginPage.clickSignIn();

    // Should see an error page or error message (not successful login)
    await page.waitForLoadState('networkidle');

    // Should not navigate to cases page
    const currentUrl = page.url();
    expect(currentUrl).not.toMatch(/\/cases/);
  });

  test('login should fail when CSRF token is invalid', async ({ page, i18nSetup, pages }) => {
    const loginPage = pages.login;
    await loginPage.navigate();

    // Fill in credentials
    await loginPage.fillCredentials('test-user', 'test-password');

    // Replace CSRF token with invalid value
    await page.evaluate(() => {
      const csrfInput = document.querySelector('input[name="_csrf"]') as HTMLInputElement;
      if (csrfInput) {
        csrfInput.value = 'invalid-token-12345';
      }
    });

    // Attempt to submit
    await loginPage.clickSignIn();

    // Should see an error page or error message
    await page.waitForLoadState('networkidle');

    // Should not navigate to cases page
    const currentUrl = page.url();
    expect(currentUrl).not.toMatch(/\/cases/);
  });

  test('login should succeed with valid CSRF token', async ({ page, i18nSetup, pages }) => {
    const loginPage = pages.login;
    await loginPage.navigate();

    // Verify CSRF token exists
    const csrfInput = page.locator('input[name="_csrf"]');
    await expect(csrfInput).toBeAttached();
    const csrfValue = await csrfInput.getAttribute('value');
    expect(csrfValue).toBeTruthy();

    // Fill in credentials and submit (with valid CSRF token)
    await loginPage.fillCredentials('test-user', 'test-password');
    await loginPage.clickSignIn();

    // Should successfully login
    await loginPage.expectSuccessfulLogin();
  });

  test('feedback form should include CSRF token', async ({ page, i18nSetup }) => {
    await setupAuth(page);

    // Navigate to a feedback form
    const caseReference = 'PC-6667-9089';
    await page.goto(`/cases/${caseReference}/do-you-want-to-give-feedback`);

    // Check for CSRF token
    const csrfInput = page.locator('input[name="_csrf"]');
    await expect(csrfInput).toBeAttached();
    await expect(csrfInput).toHaveAttribute('type', 'hidden');

    const csrfValue = await csrfInput.getAttribute('value');
    expect(csrfValue).toBeTruthy();
  });

  test('session cookies should have secure attributes', async ({ page, i18nSetup, pages, context }) => {
    const loginPage = pages.login;
    await loginPage.navigate();

    // Login to establish session
    await loginPage.fillCredentials('test-user', 'test-password');
    await loginPage.clickSignIn();
    await loginPage.expectSuccessfulLogin();

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
      expect(sessionCookie.sameSite).toBe('Strict');

      // In production, verify Secure flag
      // Note: In development (http://localhost), secure cookies won't be set
      // This test may need environment-specific assertions
    }
  });

  test('GET requests should not require CSRF validation', async ({ page, i18nSetup }) => {
    await setupAuth(page);

    // GET request to cases page should work without CSRF token concerns
    await page.goto('/cases/new');

    // Should successfully load
    await expect(page).toHaveURL(/\/cases\/new/);

    // Page should load without errors
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
  });

  test('POST request should validate CSRF token', async ({ page, i18nSetup }) => {
    await setupAuth(page);

    const caseReference = 'PC-6667-9089';
    await page.goto(`/cases/${caseReference}/do-you-want-to-give-feedback`);

    // Verify CSRF token exists before manipulation
    const csrfInput = page.locator('input[name="_csrf"]');
    await expect(csrfInput).toBeAttached();

    // Select a radio option
    await page.check('input[value="true"]');

    // Remove CSRF token
    await page.evaluate(() => {
      const csrfInput = document.querySelector('input[name="_csrf"]') as HTMLInputElement;
      if (csrfInput) {
        csrfInput.remove();
      }
    });

    // Submit form
    await page.click('button[type="submit"]');

    // Should not succeed - should show error or stay on page
    await page.waitForLoadState('networkidle');

    // Should not navigate to success page
    const currentUrl = page.url();
    expect(currentUrl).not.toMatch(/give-operator-feedback/);
  });

  test('CSRF token should remain consistent within same session', async ({ page, i18nSetup, pages }) => {
    const loginPage = pages.login;

    // First visit
    await loginPage.navigate();
    const firstToken = await page.locator('input[name="_csrf"]').getAttribute('value');

    // Second visit (same session)
    await loginPage.navigate();
    const secondToken = await page.locator('input[name="_csrf"]').getAttribute('value');

    // Token should be the same within the same session
    expect(firstToken).toBe(secondToken);
  });
});
