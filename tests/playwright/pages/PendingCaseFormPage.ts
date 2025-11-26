import { type Page, type Locator, expect } from '@playwright/test';
import { BaseEditFormPage } from './BaseEditFormPage.js';
import { t } from '../utils/index.js';

/**
 * Page object model for the pending case form (why-pending page)
 */
export class PendingCaseFormPage extends BaseEditFormPage {
  /**
   * Creates a new pending case form page object
   * @param {Page} page - The Playwright page instance
   * @param {string} caseReference - The case reference number
   */
  constructor(page: Page, caseReference: string) {
    const formUrl = `/cases/${caseReference}/why-pending`;
    const clientDetailsUrl = `/cases/${caseReference}/client-details`;
    super(page, formUrl, clientDetailsUrl);
  }

  /**
   * Gets the legend/heading element
   * @returns {Locator} The legend locator
   */
  get legend(): Locator {
    return this.page.getByText('Why is this case pending?');
  }

  /**
   * Gets the third party authorisation radio option
   * @returns {Locator} The third party option locator
   */
  get thirdPartyOption(): Locator {
    return this.page.getByText('Third party authorisation');
  }

  /**
   * Gets all pending reason radio buttons
   * @returns {Locator} The reason radios locator
   */
  get reasonRadios(): Locator {
    return this.page.locator('[name="pendingReason"]');
  }

  /**
   * Gets the other note field (conditional field for "Other" reason)
   * @returns {Locator} The other note textarea locator
   */
  get otherNoteField(): Locator {
    return this.page.locator('#otherNote');
  }

  /**
   * Asserts that the pending form has loaded correctly
   */
  async expectFormLoaded(): Promise<void> {
    await expect(this.legend).toBeVisible();
    await expect(this.saveButton).toBeVisible();
  }

  /**
   * Asserts that a specific reason option is visible
   * @param {string} text - The reason option text to check
   */
  async expectReasonOptionVisible(text: string): Promise<void> {
    await expect(this.page.getByText(text)).toBeVisible();
  }

  /**
   * Returns the expected heading text
   * @returns {string} The expected heading text
   */
  getExpectedHeading(): string {
    return 'Why is this case pending?';
  }

  /**
   * Creates a new PendingCaseFormPage instance for a specific case
   * @param {Page} page - The Playwright page instance
   * @param {string} caseReference - The case reference number
   * @returns {PendingCaseFormPage} New pending case form page instance
   */
  static forCase(page: Page, caseReference: string): PendingCaseFormPage {
    return new PendingCaseFormPage(page, caseReference);
  }
}
