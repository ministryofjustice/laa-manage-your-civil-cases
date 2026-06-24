import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page object for the SiLAS authentication flow.
 * MCC authentication is handled via an OAuth2 redirect to Microsoft Entra (SiLAS). 
 * In tests, authentication is bypassed by calling the `/auth/test-session` endpoint, which creates a valid session, without going through the OAuth flow.
 */
export class LoginPage {
  protected page: Page;
  protected readonly authUrl = '/auth';
  protected readonly testSessionUrl = '/auth/test-session';
  protected readonly casesUrl = /\/cases\/new/;

  /**
   * Creates a new login page object
   * @param {Page} page - The Playwright page instance
   */
  constructor(page: Page) {
    this.page = page;
  }

  /** Gets the main heading element */
  get heading(): Locator {
    return this.page.locator('h1');
  }

  /**
   * Navigates to the auth entry point (`/auth`).
   * In a real browser this redirects to Entra but in tests it will redirect to the Entra URL which cannot be completed without real credentials.
   */
  async navigate(): Promise<void> {
    await this.page.goto(this.authUrl);
  }

  /**
   * Creates an authenticated session via `/auth/test-session` endpoint and waits for the redirect to `/cases/new`.
   */
  async login(): Promise<void> {
    await this.page.goto(this.testSessionUrl);
    await this.expectSuccessfulLogin();
  }

  /** Asserts that login succeeded and the page is now at `/cases/new` */
  async expectSuccessfulLogin(): Promise<void> {
    await expect(this.page).toHaveURL(this.casesUrl);
  }
}
