import { type Page, type Locator, expect } from '@playwright/test';
import { BaseEditFormPage } from './BaseEditFormPage.js';
import { t } from '../utils/index.js';
import { CaseStatusComponent } from './components/CaseStatusComponent.js';

/**
 * Page object model for the give feedback form
 */
export class GiveFeedbackFormPage extends BaseEditFormPage {
  private readonly caseReference: string;
  private readonly operatorFeedbackFromUrl: string;
  private readonly statusComponent: CaseStatusComponent;
  private readonly _radioField: Locator;
  private readonly _continueButton: Locator;
  private readonly yesNoGroup: Locator;

  /**
   * Creates a new operator feedback form page object
   * @param {Page} page - The Playwright page instance
   * @param {string} caseReference - The case reference number
   */
  constructor(page: Page, caseReference: string) {
    const operatorFeedbackFromUrl = `/cases/${caseReference}/give-operator-feedback`;
    const formUrl = `/cases/${caseReference}/do-you-want-to-give-feedback`;
    const clientDetailsUrl = `/cases/${caseReference}/client-details`;
    super(page, formUrl, clientDetailsUrl );

    this.caseReference = caseReference;
    this.operatorFeedbackFromUrl = operatorFeedbackFromUrl
    this.statusComponent = new CaseStatusComponent(page);
    this._radioField = this.page.locator('#doYouWantToGiveFeedback');
    this._continueButton = this.page.locator('button[type="submit"]');
    this.yesNoGroup = this.page.getByRole('group', { name: /do you want to give feedback about the operator service\?/i, });
  }

  /**
   * Gets the URL for this give feedback page
   * @returns {string} The give feedback URL
   */
  get url(): string {
    return `/cases/${this.caseReference}/do-you-want-to-give-feedback`;
  }

  /**
   * Gets the radio field element
   * @returns {Locator} The radio field locator
   */
  get radioField(): Locator {
    return this._radioField;
  }

  /**
   * Gets the Con button element
   * @returns {Locator} The submit button locator
   */
  get continueButton(): Locator {
    return this._continueButton;
  }

  /**
   * Click the page continue button
   */
  async clickContinue(): Promise<void> {
    await this.continueButton.click();
  }

  /**
   * Select a radio option.
   * Accepts legacy values "true"/"false" (from your templates) but selects by label.
   */
  async selectCategory(value: string): Promise<void> {
    const answer =
      value === 'true' ? 'Yes' :
      value === 'false' ? 'No' :
      value;

    await this.yesNoGroup.getByRole('radio', { name: new RegExp(`^${answer}$`, 'i') }).check();
  }

  /**
   * Submit the form 
   * * @param yesOrNo radio value to select (e.g. "true" or "false")
   * @param comment optional comment text
   */
  async submitWithData(yesOrNo: string): Promise<void> {
    await this.selectCategory(yesOrNo);
    await this.clickContinue();
  }

  /**
   * Asserts that all expected form elements are visible
   */
  async expectFormElementsVisible(): Promise<void> {
    await expect(this.radioField).toBeVisible();
    await expect(this.continueButton).toBeVisible();
  }

  /**
   * Returns the expected heading text
   * @returns {string} The expected heading text
   */
  getExpectedHeading(): string {
    return t('pages.caseDetails.doYouWantToGiveFeedback.legend');
  }

  /**
   * Asserts that the case status is displayed correctly
   * @param {string} status - The expected status
   */
  async expectStatus(status: 'New' | 'Advising' | 'Closed' | 'Pending' | 'Completed'): Promise<void> {
    await this.statusComponent.expectStatus(status);
  }


 /**
   * Asserts that the form submission was successful
   */
  async expectSuccessfulSubmission(): Promise<void> {
    await expect(this.page).toHaveURL(this.operatorFeedbackFromUrl);
  }

  /**
   * Creates a new GiveFeedbackFormPage instance for a specific case
   * @param {Page} page - The Playwright page instance
   * @param {string} caseReference - The case reference number
   * @returns {GiveFeedbackFormPage} New give feedback form page instance
   */
  static forCase(page: Page, caseReference: string): GiveFeedbackFormPage {
    return new GiveFeedbackFormPage(page, caseReference);
  }
}
