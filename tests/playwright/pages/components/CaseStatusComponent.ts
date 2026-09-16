import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Component for handling case status tag assertions
 * Provides DRY approach for status tag checks across multiple pages
 */
export class CaseStatusComponent {
  private readonly page: Page;
  
  /**
   * Creates a new case status component
   * @param {Page} page - The Playwright page instance
   */
  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Gets the locator for the status value displayed in the header
   * @returns {Locator} The status text locator
   */
  private getStatusLocator(): Locator {
    return this.page.locator('.case-status-heading .govuk-body');
  }

  /**
   * Asserts that the page displays the expected case status
   * @param {string} status - The expected status
   */
  async expectStatus(status: 'New' | 'Advising' | 'Closed' | 'Pending' | 'Completed'): Promise<void> {
    const tagLocator = this.getStatusLocator();
    await expect(tagLocator).toBeVisible();
    await expect(tagLocator).toContainText(status);
  }
}
