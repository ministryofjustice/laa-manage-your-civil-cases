import type { Locator } from '@playwright/test';
import { BaseEditFormPage } from './BaseEditFormPage.js';
import { t } from '../helpers/index.js';

/**
 * Page object for the edit client name form
 */
export class EditNamePage extends BaseEditFormPage {
  /**
   * Gets the name input field
   * @returns {Locator} The name input locator
   */
  get nameInput(): Locator {
    return this.page.locator('#fullName');
  }

  /**
   * Gets the name error element
   * @returns {Locator} The name error locator
   */
  get nameError(): Locator {
    return this.page.locator('#fullName-error');
  }

  /**
   * Gets the expected heading text for this form
   * @returns {string} The expected heading text
   */
  getExpectedHeading(): string {
    return t('forms.clientDetails.name.title');
  }

  /**
   * Fills in the name field with the provided value
   * @param {string} name - The name to enter
   */
  async fillName(name: string): Promise<void> {
    await this.nameInput.fill(name);
  }

  /**
   * Clears the name field
   */
  async clearName(): Promise<void> {
    await this.nameInput.fill('');
  }

  /**
   * Submits the form with a valid name
   * @param {string} name - The name to submit (defaults to 'John Updated Smith')
   */
  async submitWithValidName(name = 'John Updated Smith'): Promise<void> {
    await this.navigate();
    await this.fillName(name);
    await this.clickSave();
  }

  /**
   * Submits the form with an empty name to test validation
   */
  async submitWithEmptyName(): Promise<void> {
    await this.navigate();
    await this.clearName();
    await this.clickSave();
  }

  /**
   * Submits the form without making any changes to test change detection
   */
  async submitWithoutChanges(): Promise<void> {
    await this.navigate();
    await this.waitForLoad();
    await this.clickSave();
  }

  /**
   * Asserts that an empty name error is displayed
   */
  async expectEmptyNameError(): Promise<void> {
    await this.expectFieldError('fullName', t('forms.clientDetails.name.validationError.notEmpty'));
  }

  /**
   * Asserts that an unchanged name error is displayed
   */
  async expectUnchangedNameError(): Promise<void> {
    await this.expectFieldError('fullName', t('forms.clientDetails.name.validationError.notChanged'));
  }
}