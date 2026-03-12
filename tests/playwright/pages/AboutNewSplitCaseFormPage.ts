import type { Page, Locator } from '@playwright/test';
import { BaseEditFormPage } from './BaseEditFormPage.js';
import { t } from '../utils/index.js';

/**
 * Page object for 'about new case' form
 */
export class AboutNewSplitCaseFormPage extends BaseEditFormPage {
  private readonly caseReference: string;

  /**
   * Creates a new about new case form page object
   * @param {Page} page - The Playwright page instance
   * @param {string} caseReference - The case reference number
   */
  constructor(page: Page, caseReference: string) {
    const aboutNewCaseFormUrl = `/cases/${caseReference}/about-new-split-case`;
    const clientDetailsUrl = `/cases/${caseReference}/client-details`;
    super(page, aboutNewCaseFormUrl, clientDetailsUrl);

    this.caseReference = caseReference;
  }

  /**
   * Gets the URL for this about new case page
   * @returns {string} The about new case URL
   */
  get url(): string {
    return `/cases/${this.caseReference}/about-new-split-case`;
  }

  /**
    * Gets the heading locator for this form
    * @returns {Locator} The locator for the `<h2 class="govuk-heading-m">` heading
    */
  getHeadingLocator(): Locator {
    return this.page.locator('h2.govuk-heading-m').first();
  }

  /**
   * Gets the locator for the original case category text
   */
  get originalCaseCategory() {
    return this.page.getByText(/Original case category of law:/i);
  }

  /**
   * Gets the locator for the new category header text
   */
  get newCategoryHeader() {
    return this.page.getByRole('heading', { name: 'Category of law for new case' });
  }

  /**
   * Gets the locator for the category select element
   */
  get categorySelect(): Locator {
    return this.page.locator('#category');
  }

  /**
   * Gets the locator for the new case category text (which shows the currently selected category or 'Select a category' if none selected)
   */
  get newCaseCategoryText() {
    return this.page.locator('text=New case category of law');
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
   * @returns {AboutNewSplitCaseFormPage} New 'about new case' form page instance
   */
  static forCase(page: Page, caseReference: string): AboutNewSplitCaseFormPage {
    return new AboutNewSplitCaseFormPage(page, caseReference);
  }
}
