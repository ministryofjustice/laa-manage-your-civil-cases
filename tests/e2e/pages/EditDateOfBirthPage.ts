import { Page, Locator, expect } from '@playwright/test';
import { BaseEditFormPage } from './BaseEditFormPage.js';
import { t, getClientDetailsUrlByStatus } from '../helpers/index.js';

export class EditDateOfBirthPage extends BaseEditFormPage {
  private readonly dayInput: Locator;
  private readonly monthInput: Locator;
  private readonly yearInput: Locator;
  private readonly hintText: Locator;

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
   * Implementation of abstract method from BaseEditFormPage
   */
  getExpectedHeading(): string {
    return t('forms.clientDetails.dateOfBirth.legend');
  }

  /**
   * Fill in the complete date of birth
   */
  async fillDateOfBirth(day: string, month: string, year: string): Promise<void> {
    await this.dayInput.fill(day);
    await this.monthInput.fill(month);
    await this.yearInput.fill(year);
  }

  /**
   * Get the day input field
   */
  getDayInput(): Locator {
    return this.dayInput;
  }

  /**
   * Get the month input field
   */
  getMonthInput(): Locator {
    return this.monthInput;
  }

  /**
   * Get the year input field
   */
  getYearInput(): Locator {
    return this.yearInput;
  }

  /**
   * Populate the hidden original date fields to simulate proper change detection
   * This works around the API service not providing original data in e2e tests
   */
  async populateOriginalDateFields(originalDay: string, originalMonth: string, originalYear: string): Promise<void> {
    await this.page.evaluate(({ day, month, year }) => {
      (document.querySelector('input[name="originalDay"]') as HTMLInputElement).value = day;
      (document.querySelector('input[name="originalMonth"]') as HTMLInputElement).value = month;
      (document.querySelector('input[name="originalYear"]') as HTMLInputElement).value = year;
    }, { day: originalDay, month: originalMonth, year: originalYear });
  }

  /**
   * Fill date and simulate change by setting different original values
   */
  async fillDateWithChange(day: string, month: string, year: string, originalDay: string = '10', originalMonth: string = '3', originalYear: string = '1985'): Promise<void> {
    await this.fillDateOfBirth(day, month, year);
    await this.populateOriginalDateFields(originalDay, originalMonth, originalYear);
  }

  /**
   * Assert that the main date of birth elements are visible
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
   * Save a valid date with change detection
   */
  async saveValidDate(day: string = '15', month: string = '5', year: string = '1990'): Promise<void> {
    await this.fillDateWithChange(day, month, year);
    await this.clickSave();
    // Wait a moment for potential processing
    await this.page.waitForTimeout(1000);
  }
}