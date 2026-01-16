import { type Page, type Locator, expect } from '@playwright/test';
import { BaseEditFormPage } from './BaseEditFormPage.js';
import { t } from '../utils/index.js';

/**
 * Page object model for the reopen case form (why-reopen-completed-case page)
 */
export class ReopenCaseFormPage extends BaseEditFormPage {
  /**
   * Creates a new reopen case form page object
   * @param {Page} page - The Playwright page instance
   * @param {string} caseReference - The case reference number
   */
  constructor(page: Page, caseReference: string) {
    const formUrl = `/cases/${caseReference}/why-reopen-completed-case`;
    const clientDetailsUrl = `/cases/${caseReference}/client-details`;
    super(page, formUrl, clientDetailsUrl);
  }

  /**
   * Gets the reopen note textarea field
   * @returns {Locator} The reopen note field locator
   */
  get reopenNoteField(): Locator {
    return this.page.locator('textarea[name="reopenNote"]');
  }

  /**
   * Fills the reopen note textarea
   * @param {string} text - The note text
   */
  async fillReopenNote(text: string): Promise<void> {
    await this.reopenNoteField.fill(text);
  }

  /**
   * Submits the form with a reopen note
   * @param {string} text - The reopen note text
   */
  async submitWithNote(text: string): Promise<void> {
    await this.fillReopenNote(text);
    await this.clickSave();
  }

  /**
   * Returns the expected heading text
   * @returns {string} The expected heading text
   */
  getExpectedHeading(): string {
    return 'Why are you reopening this case?';
  }

  /**
   * Creates a new ReopenCaseFormPage instance for a specific case
   * @param {Page} page - The Playwright page instance
   * @param {string} caseReference - The case reference number
   * @returns {ReopenCaseFormPage} New reopen case form page instance
   */
  static forCase(page: Page, caseReference: string): ReopenCaseFormPage {
    return new ReopenCaseFormPage(page, caseReference);
  }
}
