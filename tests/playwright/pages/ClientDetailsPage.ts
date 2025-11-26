import { type Page, type Locator, expect } from '@playwright/test';
import { CaseStatusComponent } from './components/CaseStatusComponent.js';

/**
 * Page object model for the client details page
 */
export class ClientDetailsPage {
  private readonly page: Page;
  private readonly caseReference: string;
  private readonly statusComponent: CaseStatusComponent;

  /**
   * Creates a new client details page object
   * @param {Page} page - The Playwright page instance
   * @param {string} caseReference - The case reference number
   */
  constructor(page: Page, caseReference: string) {
    this.page = page;
    this.caseReference = caseReference;
    this.statusComponent = new CaseStatusComponent(page);
  }

  /**
   * Gets the URL for this client details page
   * @returns {string} The client details URL
   */
  get url(): string {
    return `/cases/${this.caseReference}/client-details`;
  }

  /**
   * Gets the client name heading element
   * @returns {Locator} The client name locator
   */
  get clientName(): Locator {
    return this.page.locator('h2.govuk-heading-s').first();
  }

  /**
   * Navigates to the client details page
   */
  async navigate(): Promise<void> {
    await this.page.goto(this.url);
  }

  /**
   * Asserts that the client name is displayed correctly
   * @param {string} name - The expected client name
   */
  async expectClientName(name: string): Promise<void> {
    await expect(this.clientName).toContainText(name);
  }

  /**
   * Asserts that the case status is displayed correctly
   * @param {string} status - The expected status
   */
  async expectStatus(status: 'New' | 'Advising' | 'Closed' | 'Pending'): Promise<void> {
    await this.statusComponent.expectStatus(status);
  }

  /**
   * Creates a new ClientDetailsPage instance for a specific case
   * @param {Page} page - The Playwright page instance
   * @param {string} caseReference - The case reference number
   * @returns {ClientDetailsPage} New client details page instance
   */
  static forCase(page: Page, caseReference: string): ClientDetailsPage {
    return new ClientDetailsPage(page, caseReference);
  }
}
