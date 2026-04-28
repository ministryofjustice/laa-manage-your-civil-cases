import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Component for handling case status tag assertions
 * Provides DRY approach for status tag checks across multiple pages
 */
export class CaseStatusComponent {
  private readonly page: Page;
  
  /**
   * Mapping of status names to GOV.UK Design System tag modifier classes
   */
  private readonly tagClasses = {
    'New': '.govuk-tag--green.govuk-\\!-margin-bottom-2',
    'Advising': '.govuk-tag--orange.govuk-\\!-margin-bottom-2',
    'Closed': '.govuk-tag--grey.govuk-\\!-margin-bottom-2',
    'Pending': '.govuk-tag--blue.govuk-\\!-margin-bottom-2',
    'Completed': '.govuk-tag--pink.govuk-\\!-margin-bottom-2'
  } as const;

  /**
   * Creates a new case status component
   * @param {Page} page - The Playwright page instance
   */
  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Gets the tag locator for a specific status
   * @param {string} status - The case status
   * @returns {Locator} The status tag locator
   */
  private getTagLocator(status: 'New' | 'Advising' | 'Closed' | 'Pending'| 'Completed'): Locator {
    return this.page.locator(this.tagClasses[status]);
  }

  /**
   * Asserts that the page displays the expected case status
   * @param {string} status - The expected status
   */
  async expectStatus(status: 'New' | 'Advising' | 'Closed' | 'Pending' | 'Completed'): Promise<void> {
    const tagLocator = this.getTagLocator(status);
    await expect(tagLocator).toBeVisible();
    await expect(tagLocator).toContainText(status);
  }
}
