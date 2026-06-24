import type { Page, Locator } from '@playwright/test';
import { BaseEditFormPage } from './BaseEditFormPage.js';
import { t } from '../utils/index.js';
import { expect } from '#node_modules/@types/chai/index.js';

/**
 * Page object for 'change category of law' form
 */
export class ChangeCategoryOfLawFormPage extends BaseEditFormPage {
  private readonly caseReference: string;

  /**
   * Creates a new change category of law form page object
   * @param {Page} page - The Playwright page instance
   * @param {string} caseReference - The case reference number
   */
  constructor(page: Page, caseReference: string) {
    const changeCategoryOfLawFormUrl = `/cases/${caseReference}/change-law-category`;
    const clientDetailsUrl = `/cases/${caseReference}/client-details`;
    super(page, changeCategoryOfLawFormUrl, clientDetailsUrl);

    this.caseReference = caseReference;
  }

  get categorySelect(): Locator {
    return this.page.locator('#category');
  }

  get notesTextarea(): Locator {
    return this.page.locator('#notes');
  }

  getExpectedHeading(): string {
    return 'Change category of law';
  }

  /**
   * Gets the locator for the new case category text (which shows the currently selected category or 'Select a category' if none selected)
   */
  get newCategoryText() {
    return this.page.locator('text=New category of law');
  }

  /**
   * Creates a ChangeCategoryOfLawFormPage instance for a specific case
   * @param {Page} page - The Playwright page instance
   * @param {string} caseReference - The case reference number
   * @returns {ChangeCategoryOfLawFormPage} New 'change category of law' form page instance
   */
  static forCase(page: Page, caseReference: string): ChangeCategoryOfLawFormPage {
    return new ChangeCategoryOfLawFormPage(page, caseReference);
  }
}
