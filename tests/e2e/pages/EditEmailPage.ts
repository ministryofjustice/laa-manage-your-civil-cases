import { Page, Locator, expect } from '@playwright/test';
import { BaseEditFormPage } from './BaseEditFormPage.js';
import { t, getClientDetailsUrlByStatus } from '../helpers/index.js';

export class EditEmailPage extends BaseEditFormPage {
  private readonly emailInput: Locator;

  constructor(page: Page) {
    const formUrl = getClientDetailsUrlByStatus('default') + '/change/email-address';
    const clientDetailsUrl = getClientDetailsUrlByStatus('default');
    super(page, formUrl, clientDetailsUrl);
    this.emailInput = page.locator('#emailAddress');
  }

  /**
   * Implementation of abstract method from BaseEditFormPage
   */
  getExpectedHeading(): string {
    return t('forms.clientDetails.email.title');
  }

  /**
   * Fill in the email address
   */
  async fillEmailAddress(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  /**
   * Get the email input field
   */
  getEmailInput(): Locator {
    return this.emailInput;
  }

  /**
   * Assert that the main email elements are visible
   */
  async assertMainElementsVisible(): Promise<void> {
    await expect(this.heading).toContainText(t('forms.clientDetails.email.title'));
    await expect(this.emailInput).toBeVisible();
    await expect(this.saveButton).toBeVisible();
  }

  /**
   * Submit form with invalid email and assert validation errors appear
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