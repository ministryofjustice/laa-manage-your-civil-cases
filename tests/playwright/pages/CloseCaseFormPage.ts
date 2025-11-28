import { type Page, type Locator, expect } from '@playwright/test';
import { BaseEditFormPage } from './BaseEditFormPage.js';
import { t } from '../utils/index.js';

/**
 * Page object model for the close case form (why-closed page)
 */
export class CloseCaseFormPage extends BaseEditFormPage {
  /**
   * Creates a new close case form page object
   * @param {Page} page - The Playwright page instance
   * @param {string} caseReference - The case reference number
   */
  constructor(page: Page, caseReference: string) {
    const formUrl = `/cases/${caseReference}/why-closed`;
    const clientDetailsUrl = `/cases/${caseReference}/client-details`;
    super(page, formUrl, clientDetailsUrl);
  }

  /**
   * Gets all event code radio buttons
   * @returns {Locator} The event code radios locator
   */
  get eventCodeRadios(): Locator {
    return this.page.locator('[name="eventCode"]');
  }

  /**
   * Gets the close note textarea field
   * @returns {Locator} The close note field locator
   */
  get closeNoteField(): Locator {
    return this.page.locator('textarea[name="closeNote"]');
  }

  /**
   * Selects an event code radio button by value
   * @param {string} code - The event code value (e.g., 'MIS-OOS')
   */
  async selectEventCode(code: string): Promise<void> {
    await this.page.check(`input[value="${code}"]`);
  }

  /**
   * Fills the close note textarea
   * @param {string} text - The note text
   */
  async fillCloseNote(text: string): Promise<void> {
    await this.closeNoteField.fill(text);
  }

  /**
   * Submits the form with event code and note
   * @param {string} eventCode - The event code to select
   * @param {string} note - The close note text
   */
  async submitWithData(eventCode: string, note: string): Promise<void> {
    await this.selectEventCode(eventCode);
    await this.fillCloseNote(note);
    await this.clickSave();
  }

  /**
   * Returns the expected heading text
   * @returns {string} The expected heading text
   */
  getExpectedHeading(): string {
    return 'Why are you closing this case?';
  }

  /**
   * Creates a new CloseCaseFormPage instance for a specific case
   * @param {Page} page - The Playwright page instance
   * @param {string} caseReference - The case reference number
   * @returns {CloseCaseFormPage} New close case form page instance
   */
  static forCase(page: Page, caseReference: string): CloseCaseFormPage {
    return new CloseCaseFormPage(page, caseReference);
  }
}
