import type { Page, Locator } from '@playwright/test';
import { BaseEditFormPage } from './BaseEditFormPage.js';
import { t } from '../utils/index.js';

/**
 * Page object for the edit client name form
 */
export class SplitCaseFormPage extends BaseEditFormPage {
  
  private readonly caseReference: string;
  /**
     * Creates a new operator feedback form page object
     * @param {Page} page - The Playwright page instance
     * @param {string} caseReference - The case reference number
     */
    constructor(page: Page, caseReference: string) {
      const splitCaseFormUrl = `/cases/${caseReference}/split-this-case`;
      const clientDetailsUrl = `/cases/${caseReference}/client-details`;
      super(page, splitCaseFormUrl, clientDetailsUrl );
  
      this.caseReference = caseReference;
      //this.operatorFeedbackFromUrl = operatorFeedbackFromUrl
      //this.statusComponent = new CaseStatusComponent(page);
      //this._radioField = this.page.locator('#doYouWantToGiveFeedback');
      //this._continueButton = this.page.locator('button[type="submit"]');
      //this.yesNoGroup = this.page.getByRole('group', { name: /do you want to give feedback about the operator service\?/i, });
    }

  /**
   * Gets the expected heading text for this form
   * @returns {Locator} The expected heading text
   */
  getExpectedHeading(): string {
    return t('pageTitle');
  }

  /**
   * Gets the URL for this split case page
   * @returns {string} The split case URL
   */
  get url(): string {
    return `/cases/${this.caseReference}/split-this-case`;
  }

    /**
   * Creates a new GiveFeedbackFormPage instance for a specific case
   * @param {Page} page - The Playwright page instance
   * @param {string} caseReference - The case reference number
   * @returns {GiveFeedbackFormPage} New give feedback form page instance
   */
  static forCase(page: Page, caseReference: string): SplitCaseFormPage {
    return new SplitCaseFormPage(page, caseReference);
  }
}
