import { type Page, type Locator, expect } from '@playwright/test';
import { t } from '../utils/index.js';

/**
 * Page object for the login page
 */
export class LoginPage {
  protected page: Page;
  protected readonly loginUrl = '/login/';
  protected readonly casesUrl = /\/cases\/new/;

  /**
   * Creates a new login page object
   * @param {Page} page - The Playwright page instance
   */
  constructor(page: Page) {
    this.page = page;
  }

  // Elements
  /**
   * Gets the main heading element
   * @returns {Locator} The heading locator
   */
  get heading(): Locator {
    return this.page.locator('h1');
  }

  /**
   * Gets the username input field
   * @returns {Locator} The username input locator
   */
  get usernameInput(): Locator {
    return this.page.locator('input[name="username"]');
  }

  /**
   * Gets the password input field
   * @returns {Locator} The password input locator
   */
  get passwordInput(): Locator {
    return this.page.locator('input[name="password"]');
  }

  /**
   * Gets the sign in button
   * @returns {Locator} The sign in button locator
   */
  get signInButton(): Locator {
    return this.page.getByRole('button', { name: t('pages.login.signInButton') });
  }

  // Actions
  /**
   * Navigates to the login page
   * @param {string} url - Optional custom login URL (defaults to /login/)
   */
  async navigate(url = this.loginUrl): Promise<void> {
    await this.page.goto(url);
  }

  /**
   * Fills in the username field
   * @param {string} username - The username to enter
   */
  async fillUsername(username: string): Promise<void> {
    await this.usernameInput.fill(username);
  }

  /**
   * Fills in the password field
   * @param {string} password - The password to enter
   */
  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  /**
   * Fills in both username and password fields
   * @param {string} username - The username to enter
   * @param {string} password - The password to enter
   */
  async fillCredentials(username: string, password: string): Promise<void> {
    await this.fillUsername(username);
    await this.fillPassword(password);
  }

  /**
   * Clicks the sign in button
   */
  async clickSignIn(): Promise<void> {
    await this.signInButton.click();
  }

  /**
   * Performs a complete login flow
   * @param {string} username - The username to use
   * @param {string} password - The password to use
   * @param {string} loginUrl - Optional custom login URL
   */
  async login(username = 'test-user', password = 'test-password', loginUrl = '/login'): Promise<void> {
    await this.navigate(loginUrl);
    await this.fillCredentials(username, password);
    await this.clickSignIn();
    await this.expectSuccessfulLogin();
  }

  /**
   * Modifies the form action to post to a specific URL
   * @param {string} actionUrl - The URL to set as the form action
   */
  async setFormAction(actionUrl: string): Promise<void> {
    await this.page.evaluate((url) => {
      const form = document.querySelector('form');
      if (form) {
        form.action = url;
      }
    }, actionUrl);
  }

  // Assertions
  /**
   * Asserts that the login page is displayed correctly
   * @param {string} expectedHeading - The expected heading text (defaults to 'Sign in')
   */
  async expectPageLoaded(expectedHeading = 'Sign in'): Promise<void> {
    await expect(this.heading).toContainText(expectedHeading);
    await expect(this.usernameInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.signInButton).toBeVisible();
  }

  /**
   * Asserts that the login was successful and redirected to cases page
   */
  async expectSuccessfulLogin(): Promise<void> {
    await expect(this.page).toHaveURL(this.casesUrl);
  }
}
