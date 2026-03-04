import type { Page, Locator } from '@playwright/test';
import { BaseEditFormPage } from './BaseEditFormPage.js';
import { t } from '../utils/index.js';

/**
 * Page object for 'about new case' form
 */
export class AboutNewCaseFormPage extends BaseEditFormPage {
  private readonly caseReference: string;

  /**
   * Creates a new about new case form page object
   * @param {Page} page - The Playwright page instance
   * @param {string} caseReference - The case reference number
   */
  constructor(page: Page, caseReference: string) {
    const aboutNewCaseFormUrl = `/cases/${caseReference}/about-new-case`;
    const clientDetailsUrl = `/cases/${caseReference}/client-details`;
    super(page, aboutNewCaseFormUrl, clientDetailsUrl);

    this.caseReference = caseReference;
  }

  /**
   * Gets the URL for this about new case page
   * @returns {string} The about new case URL
   */
  get url(): string {
    return `/cases/${this.caseReference}/about-new-case`;
  }

 /**
   * Gets the heading locator for this form
   * @returns {Locator} The locator for the `<h2 class="govuk-heading-m">` heading
   */
  getHeadingLocator(): Locator {
    return this.page.locator('h2.govuk-heading-m').first();
}

 /**
   * Gets the heading locator for this form
   * @returns {Locator} The locator for the `<h2 class="govuk-heading-m">` heading
   */
  getExpectedHeading(): string {
    return t('pageTitle');
  }


  /**
   * Creates a SplitThisCaseFormPage instance for a specific case
   * @param {Page} page - The Playwright page instance
   * @param {string} caseReference - The case reference number
   * @returns {AboutNewCaseFormPage} New 'about new case' form page instance
   */
  static forCase(page: Page, caseReference: string): AboutNewCaseFormPage {
    return new AboutNewCaseFormPage(page, caseReference);
  }
}
