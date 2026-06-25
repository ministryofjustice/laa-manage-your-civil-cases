import type { Page, Locator } from '@playwright/test';
import { BaseEditFormPage } from './BaseEditFormPage.js';
import { t } from '../utils/index.js';

/**
 * Page object for 'check split case answers' form
 */
export class CheckSplitCaseAnswersPage extends BaseEditFormPage {
  private readonly caseReference: string;

  /**
   * Creates a check split case answers page object
   * @param {Page} page - The Playwright page instance
   * @param {string} caseReference - The case reference number
   */
  constructor(page: Page, caseReference: string) {
    const checkSplitCaseAnswersUrl = `/cases/${caseReference}/check-split-case-answers`;
    const clientDetailsUrl = `/cases/${caseReference}/client-details`;
    super(page, checkSplitCaseAnswersUrl, clientDetailsUrl);

    this.caseReference = caseReference;
  }

  /**
   * Gets the URL for this check split case answers page
   * @returns {string} The check split case answers URL
   */
  get url(): string {
    return `/cases/${this.caseReference}/check-split-case-answers`;
  }

  /**
    * Gets the heading locator for this form
    * @returns {Locator} The locator for the `<h2 class="govuk-heading-m">` heading
    */
  getHeadingLocator(): Locator {
    return this.page.locator('h2.govuk-heading-m').first();
  }

  /**
   * Gets the locator for the original case card heading
   */
  get originalCaseHeader(): Locator {
    return this.page.getByRole('heading', { name: 'Original case' });
  }

  /**
   * Gets the locator for the new case card heading
   */
  get newCaseHeader(): Locator {
    return this.page.getByRole('heading', { name: 'New case' });
  }

  /**
   * Gets the locator for the category of law row label
   */
  get categoryOfLawLabel() {
    return this.page.getByText(t('pages.caseDetails.checkYourAnswers.categoryOfLaw'));
  }

  /**
   * Gets the locator for the assigned to row label
   */
  get assignedToLabel() {
    return this.page.getByText(t('pages.caseDetails.checkYourAnswers.assignedTo'));
  }

  /**
   * Gets the locator for the why split case row label
   */
  get whySplitCaseLabel() {
    return this.page.getByText(t('pages.caseDetails.checkYourAnswers.whySplitCase'));
  }

  /**
   * Gets the locator for the change link in the new case summary card
   */
  get changeLink() {
    return this.page.getByRole('link', { name: t('pages.caseDetails.checkYourAnswers.changeLink'), });
  }

  /**
   * Gets the locator for the confirm split button
   */
  get confirmSplitButton() {
    return this.page.getByRole('button', { name: t('pages.caseDetails.checkYourAnswers.confirmSplitButton'), });
  }

  /**
   * Gets the locator for the cancel link
   */
  get cancelLink() {
    return this.page.getByRole('link', { name: t('common.cancel'), });
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
   * @returns {CheckSplitCaseAnswersPage} New 'about new case' form page instance
   */
  static forCase(page: Page, caseReference: string): CheckSplitCaseAnswersPage {
    return new CheckSplitCaseAnswersPage(page, caseReference);
  }
}