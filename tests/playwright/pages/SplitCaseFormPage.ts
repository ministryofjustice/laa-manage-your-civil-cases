import type { Page } from '@playwright/test';
import { BaseEditFormPage } from './BaseEditFormPage.js';
import { t } from '../utils/index.js';

/**
 * Page object for 'split this case' form
 */
export class SplitThisCaseFormPage extends BaseEditFormPage {
  private readonly caseReference: string;

  /**
   * Creates a new split this case form page object
   * @param {Page} page - The Playwright page instance
   * @param {string} caseReference - The case reference number
   */
  constructor(page: Page, caseReference: string) {
    const splitThisCaseFormUrl = `/cases/${caseReference}/split-this-case`;
    const clientDetailsUrl = `/cases/${caseReference}/client-details`;
    super(page, splitThisCaseFormUrl, clientDetailsUrl);

    this.caseReference = caseReference;
  }

  /**
   * Gets the URL for this split this case page
   * @returns {string} The split this case URL
   */
  get url(): string {
    return `/cases/${this.caseReference}/split-this-case`;
  }

  /**
   * Gets the expected heading text for this form
   * @returns {Locator} The expected heading text
   */
  getExpectedHeading(): string {
    return t('pageTitle');
  }

  /**
   * Creates a SplitThisCaseFormPage instance for a specific case
   * @param {Page} page - The Playwright page instance
   * @param {string} caseReference - The case reference number
   * @returns {SplitThisCaseFormPage} New 'split this case' form page instance
   */
  static forCase(page: Page, caseReference: string): SplitThisCaseFormPage {
    return new SplitThisCaseFormPage(page, caseReference);
  }
}
