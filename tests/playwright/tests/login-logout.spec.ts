import { test, expect } from '../fixtures/index.js';

// Test data
const TEST_CREDENTIALS = {
  username: 'test-user',
  password: 'test-password'
};

const LOGIN_HEADING = 'Sign in';

test.describe('Login and Logout Flow', () => {
  test('GET /login/ should display login page', async ({ page, i18nSetup, pages }) => {
    const loginPage = pages.login;
    await loginPage.navigate();
    await loginPage.expectPageLoaded(LOGIN_HEADING);
  });

  test('POST /login/ should process login and redirect on success', async ({ page, i18nSetup, pages }) => {
    const loginPage = pages.login;
    await loginPage.navigate();
    await loginPage.fillCredentials(TEST_CREDENTIALS.username, TEST_CREDENTIALS.password);
    await loginPage.clickSignIn();
    await loginPage.expectSuccessfulLogin();
  });

  test('POST /login/ with trailing slash should process login', async ({ page, i18nSetup, pages }) => {
    const loginPage = pages.login;
    await loginPage.navigate();
    await loginPage.fillCredentials(TEST_CREDENTIALS.username, TEST_CREDENTIALS.password);
    
    // Override the form action to post to /login/ with trailing slash
    await loginPage.setFormAction('/login/');

    await loginPage.clickSignIn();
    await loginPage.expectSuccessfulLogin();
  });

  test('GET /logout should clear session and redirect to login', async ({ page, i18nSetup, pages }) => {
    const loginPage = pages.login;
    await loginPage.login();
    
    await page.goto('/logout');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('h1')).toContainText(LOGIN_HEADING);
  });

  test('GET /login/logout should clear session and redirect to login', async ({ page, i18nSetup, pages }) => {
    const loginPage = pages.login;
    await loginPage.login();
    
    await page.goto('/login/logout');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('h1')).toContainText(LOGIN_HEADING);
  });
});
