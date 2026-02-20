import { type Page, type Locator, expect } from '@playwright/test';
import { t } from '../utils/index.js';

/**
 * Abstract base class for edit form page objects providing common functionality
 */
export abstract class BaseEditFormPage {
  protected page: Page;
  protected formUrl: string;
  protected clientDetailsUrl: string;

  /**
   * Creates a new edit form page object
   * @param {Page} page - The Playwright page instance
   * @param {string} formUrl - The URL of the form to edit
   * @param {string} clientDetailsUrl - The URL to redirect to after successful submission
   */
  constructor(page: Page, formUrl: string, clientDetailsUrl: string) {
    this.page = page;
    this.formUrl = formUrl;
    this.clientDetailsUrl = clientDetailsUrl;
  }

  // Common elements across all edit forms
  /**
   * Gets the main heading element of the form, which has `govuk-heading-m'` class
   * @returns {Locator} The heading locator
   */
  get heading(): Locator {
    return this.page.locator('h2.govuk-heading-m').nth(0);
  }
  
  /**
   * Gets the legend element of the form, which has `govuk-fieldset__legend--m`class
   * @returns {Locator} The legend locator
   */
  get legendFieldset(): Locator {
    return this.page.locator('legend.govuk-fieldset__legend--m');
  }

  /**
   * Gets the heading element of the form, which is inside a label
   * @returns {Locator} The heading locator
   */
  get labelWrapper(): Locator {
    return this.page.locator('label.govuk-label--m');
  }

  /**
   * Gets the page 
   * @returns {Page} The page
   */
  get getPage(): Page {
    return this.page;
  }
  
  /**
   * Gets the save button element
   * @returns {Locator} The save button locator
   */
  get saveButton(): Locator {
    return this.page.locator('button[type="submit"]');
  }

  /**
   * Gets the cancel link element
   * @returns {Locator} The cancel link locator
   */
  get cancelLink(): Locator {
    return this.page.getByRole('link', { name: t('common.cancel') });
  }

  /**
   * Gets the back link element
   * @returns {Locator} The back link locator
   */
  get backLink(): Locator {
    return this.page.locator('.govuk-back-link');
  }

  /**
   * Gets the error summary element
   * @returns {Locator} The error summary locator
   */
  get errorSummary(): Locator {
    return this.page.locator('.govuk-error-summary');
  }

  // Common actions
  /**
   * Navigates to the form URL
   */
  async navigate(): Promise<void> {
    await this.page.goto(this.formUrl);
  }

  /**
   * Clicks the save button
   */
  async clickSave(): Promise<void> {
    await this.saveButton.click();
  }

  /**
   * Clicks the cancel link
   */
  async clickCancel(): Promise<void> {
    await this.cancelLink.click();
  }

  /**
   * Waits for the page to fully load
   */
  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  // Common assertions
  /**
   * Asserts that the page has loaded with the expected heading
   * @param {string} expectedHeading - The expected heading text
   */
  async expectPageLoaded(expectedHeading: string): Promise<void> {
    await expect(this.heading).toContainText(expectedHeading);
    await expect(this.saveButton).toBeVisible();
    await expect(this.cancelLink).toBeVisible();
  }

  /**
   * Asserts that clicking cancel navigates back to client details
   */
  async expectCancelNavigatesBack(): Promise<void> {
    await this.navigate();
    await this.clickCancel();
    await expect(this.page).toHaveURL(this.clientDetailsUrl);
  }

  /**
   * Asserts that the error summary is visible
   */
  async expectErrorSummaryVisible(): Promise<void> {
    await expect(this.errorSummary).toBeVisible();
  }

  /**
   * Asserts that a field has an error with the expected message
   * @param {string} fieldId - The ID of the field to check
   * @param {string} expectedMessage - The expected error message
   */
  async expectFieldError(fieldId: string, expectedMessage: string): Promise<void> {
    // Check error summary link
    const errorLink = this.page.locator(`a[href="#${fieldId}"]`);
    await expect(errorLink).toBeVisible();
    await expect(errorLink).toHaveText(expectedMessage);
    
    // Check field has error styling
    const field = this.page.locator(`#${fieldId}`);
    await expect(field).toHaveClass(/govuk-input--error/);
  }

  /**
   * Asserts that the form submission was successful
   */
  async expectSuccessfulSubmission(): Promise<void> {
    await expect(this.page).toHaveURL(this.clientDetailsUrl);
  }

  // Abstract method that each specific page must implement
  abstract getExpectedHeading(): string;
}