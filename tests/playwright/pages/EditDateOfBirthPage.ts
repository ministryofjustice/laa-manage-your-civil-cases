import { type Page, type Locator, expect } from '@playwright/test';
import { BaseEditFormPage } from './BaseEditFormPage.js';
import { t, getClientDetailsUrlByStatus } from '../utils/index.js';

// Constants for default values and timeouts
const DEFAULT_WAIT_TIMEOUT = 1000;
const DEFAULT_DAY = '10';
const DEFAULT_MONTH = '3';
const DEFAULT_YEAR = '1985';

/**
 * Page object for the edit date of birth form
 */
export class EditDateOfBirthPage extends BaseEditFormPage {
  private readonly dayInput: Locator;
  private readonly monthInput: Locator;
  private readonly yearInput: Locator;
  private readonly hintText: Locator;

  /**
   * Creates a new edit date of birth page object
   * @param {Page} page - The Playwright page instance
   */
  constructor(page: Page) {
    const formUrl = getClientDetailsUrlByStatus('default') + '/change/date-of-birth';
    const clientDetailsUrl = getClientDetailsUrlByStatus('default');
    super(page, formUrl, clientDetailsUrl);
    this.dayInput = page.locator('#dateOfBirth-day');
    this.monthInput = page.locator('#dateOfBirth-month');
    this.yearInput = page.locator('#dateOfBirth-year');
    this.hintText = page.locator('.govuk-hint');
  }

  /**
   * Gets the expected heading text for this form
   * @returns {string} The expected heading text
   */
  getExpectedHeading(): string {
    return t('forms.clientDetails.dateOfBirth.legend');
  }

  /**
   * Fills in the complete date of birth
   * @param {string} day - The day value
   * @param {string} month - The month value  
   * @param {string} year - The year value
   */
  async fillDateOfBirth(day: string, month: string, year: string): Promise<void> {
    await this.dayInput.fill(day);
    await this.monthInput.fill(month);
    await this.yearInput.fill(year);
  }

  /**
   * Gets the day input field
   * @returns {Locator} The day input locator
   */
  getDayInput(): Locator {
    return this.dayInput;
  }

  /**
   * Gets the month input field
   * @returns {Locator} The month input locator
   */
  getMonthInput(): Locator {
    return this.monthInput;
  }

  /**
   * Gets the year input field
   * @returns {Locator} The year input locator
   */
  getYearInput(): Locator {
    return this.yearInput;
  }

  /**
   * Populates the hidden original date fields to simulate proper change detection
   * This works around the API service not providing original data in e2e tests
   * @param {string} originalDay - The original day value
   * @param {string} originalMonth - The original month value
   * @param {string} originalYear - The original year value
   */
  async populateOriginalDateFields(originalDay: string, originalMonth: string, originalYear: string): Promise<void> {
    await this.page.evaluate(({ day, month, year }) => {
      const dayInput = document.querySelector('input[name="originalDay"]') as HTMLInputElement;
      const monthInput = document.querySelector('input[name="originalMonth"]') as HTMLInputElement;
      const yearInput = document.querySelector('input[name="originalYear"]') as HTMLInputElement;
      if (dayInput) dayInput.value = day;
      if (monthInput) monthInput.value = month;
      if (yearInput) yearInput.value = year;
    }, { day: originalDay, month: originalMonth, year: originalYear });
  }

  /**
   * Fills date and simulates change by setting different original values
   * @param {string} day - The day value to fill
   * @param {string} month - The month value to fill
   * @param {string} year - The year value to fill
   * @param {string} originalDay - The original day value (defaults to '10')
   * @param {string} originalMonth - The original month value (defaults to '3')
   * @param {string} originalYear - The original year value (defaults to '1985')
   */
  async fillDateWithChange(
    day: string, 
    month: string, 
    year: string, 
    originalDay = DEFAULT_DAY, 
    originalMonth = DEFAULT_MONTH, 
    originalYear = DEFAULT_YEAR
  ): Promise<void> {
    await this.fillDateOfBirth(day, month, year);
    await this.populateOriginalDateFields(originalDay, originalMonth, originalYear);
  }

  /**
   * Asserts that the main date of birth elements are visible
   */
  async assertMainElementsVisible(): Promise<void> {
    await expect(this.heading).toContainText(t('forms.clientDetails.dateOfBirth.legend'));
    await expect(this.dayInput).toBeVisible();
    await expect(this.monthInput).toBeVisible();
    await expect(this.yearInput).toBeVisible();
    await expect(this.saveButton).toBeVisible();
    await expect(this.cancelLink).toBeVisible();
    await expect(this.hintText).toContainText(t('forms.clientDetails.dateOfBirth.hint'));
    await expect(this.backLink).toBeVisible();
  }

  /**
   * Saves a valid date with change detection
   * @param {string} day - The day value (defaults to '15')
   * @param {string} month - The month value (defaults to '5')
   * @param {string} year - The year value (defaults to '1990')
   */
  async saveValidDate(day = '15', month = '5', year = '1990'): Promise<void> {
    await this.fillDateWithChange(day, month, year);
    await this.clickSave();
    // Wait a moment for potential processing
    await this.page.waitForTimeout(DEFAULT_WAIT_TIMEOUT);
  }
}