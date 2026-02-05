import { type Page, type Locator, expect } from '@playwright/test';
import { BaseEditFormPage } from './BaseEditFormPage.js';
import { t } from '../utils/index.js';

/**
 * Page object model for the operator feedback form
 */
export class OperatorFeedbackFormPage extends BaseEditFormPage {
  /**
   * Creates a new operator feedback form page object
   * @param {Page} page - The Playwright page instance
   * @param {string} caseReference - The case reference number
   */
  constructor(page: Page, caseReference: string) {
    const formUrl = `/cases/${caseReference}/give-operator-feedback`;
    const clientDetailsUrl = `/cases/${caseReference}/client-details`;
    super(page, formUrl, clientDetailsUrl);
  }

  /**
   * Gets the category select dropdown
   * @returns {Locator} The category select locator
   */
  get categorySelect(): Locator {
    return this.page.locator('#category');
  }

  /**
   * Gets the comment textarea field
   * @returns {Locator} The comment field locator
   */
  get commentField(): Locator {
    return this.page.locator('#comment');
  }

  /**
   * Gets the character count info element
   * @returns {Locator} The character count info locator
   */
  get characterCountInfo(): Locator {
    return this.page.locator('#comment-info');
  }

  /**
   * Selects a category from the dropdown
   * @param {string} value - The category value (e.g., 'ADCO')
   */
  async selectCategory(value: string): Promise<void> {
    await this.categorySelect.selectOption(value);
  }

  /**
   * Fills the comment textarea
   * @param {string} text - The comment text
   */
  async fillComment(text: string): Promise<void> {
    await this.commentField.fill(text);
  }

  /**
   * Clears the comment field (useful for validation testing)
   */
  async clearCommentField(): Promise<void> {
    await this.commentField.fill('');
  }

  /**
   * Submits the form with category and comment
   * @param {string} category - The category value to select
   * @param {string} comment - The comment text
   */
  async submitWithData(category: string, comment: string): Promise<void> {
    await this.selectCategory(category);
    await this.fillComment(comment);
    await this.clickSave();
  }

  /**
   * Asserts that all expected form elements are visible
   */
  async expectFormElementsVisible(): Promise<void> {
    await expect(this.categorySelect).toBeVisible();
    await expect(this.commentField).toBeVisible();
    await expect(this.characterCountInfo).toBeVisible();
    await expect(this.saveButton).toBeVisible();
    await expect(this.cancelLink).toBeVisible();
  }

  /**
   * Asserts that the category field has a validation error
   */
  async expectCategoryFieldError(): Promise<void> {
    const categoryError = this.page.locator('#category-error');
    await expect(categoryError).toBeVisible();
  }

  /**
   * Asserts that the comment field has a validation error
   */
  async expectCommentFieldError(): Promise<void> {
    const commentError = this.page.locator('#comment-error');
    await expect(commentError).toBeVisible();
  }

  /**
   * Returns the expected heading text
   * @returns {string} The expected heading text
   */
  getExpectedHeading(): string {
    return t('pages.caseDetails.operatorFeedback.legend');
  }

  /**
   * Creates a new OperatorFeedbackFormPage instance for a specific case
   * @param {Page} page - The Playwright page instance
   * @param {string} caseReference - The case reference number
   * @returns {OperatorFeedbackFormPage} New operator feedback form page instance
   */
  static forCase(page: Page, caseReference: string): OperatorFeedbackFormPage {
    return new OperatorFeedbackFormPage(page, caseReference);
  }
}
