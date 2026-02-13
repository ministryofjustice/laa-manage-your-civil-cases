import { type Page, type Locator, expect } from '@playwright/test';
import { BaseEditFormPage } from './BaseEditFormPage.js';
import { t, getClientDetailsUrlByStatus } from '../utils/index.js';

/**
 * Page object for the edit email address form
 */
export class EditEmailPage extends BaseEditFormPage {
  private readonly emailInput: Locator;

  /**
   * Creates a new edit email page object
   * @param {Page} page - The Playwright page instance
   */
  constructor(page: Page) {
    const formUrl = getClientDetailsUrlByStatus('default') + '/change/email-address';
    const clientDetailsUrl = getClientDetailsUrlByStatus('default');
    super(page, formUrl, clientDetailsUrl);
    this.emailInput = page.locator('#emailAddress');
  }

  /**
   * Gets the expected heading text for this form
   * @returns {string} The expected heading text
   */
  getExpectedHeading(): string {
    return t('forms.clientDetails.email.title');
  }

  /**
   * Fills in the email address field
   * @param {string} email - The email address to enter
   */
  async fillEmailAddress(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  /**
   * Gets the email input field
   * @returns {Locator} The email input locator
   */
  getEmailInput(): Locator {
    return this.emailInput;
  }

  /**
   * Asserts that the main email elements are visible
   */
  async assertMainElementsVisible(): Promise<void> {
    await expect(this.headingH1Wrapper).toContainText(t('forms.clientDetails.email.title'));
    await expect(this.emailInput).toBeVisible();
    await expect(this.saveButton).toBeVisible();
  }

  /**
   * Submits form with invalid email and asserts validation errors appear
   * @param {string} invalidEmail - The invalid email to test with
   */
  async assertInvalidEmailValidation(invalidEmail: string): Promise<void> {
    await this.fillEmailAddress(invalidEmail);
    await this.clickSave();

    // Should stay on same page (not redirect)
    await expect(this.page).toHaveURL(this.formUrl);

    // Check error summary appears and contains correct title
    await expect(this.errorSummary).toBeVisible();
    await expect(this.errorSummary).toContainText(t('components.errorSummary.title'));

    // Check error summary links to problem field
    const errorLink = this.page.locator('.govuk-error-summary a[href="#emailAddress"]');
    await expect(errorLink).toBeVisible();

    // Check field-level error styling
    await expect(this.emailInput).toHaveClass(/govuk-input--error/);

    // Check error message appears near the field
    const errorMessage = this.page.locator('.govuk-error-message');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(t('forms.clientDetails.email.validationError.invalidFormat'));
  }
}