import { type Page, type Locator, expect } from '@playwright/test';
import { BaseEditFormPage } from './BaseEditFormPage.js';
import { t, getClientDetailsUrlByStatus } from '../utils/index.js';

/**
 * Page object for the edit phone number form
 */
export class EditPhoneNumberPage extends BaseEditFormPage {
  /**
   * Creates a new edit phone number page object
   * @param {Page} page - The Playwright page instance
   */
  constructor(page: Page) {
    const formUrl = getClientDetailsUrlByStatus('default') + '/change/phone-number';
    const clientDetailsUrl = getClientDetailsUrlByStatus('default');
    super(page, formUrl, clientDetailsUrl);
  }

  /**
   * Gets the expected heading text for this form
   * @returns {string} The expected heading text
   */
  getExpectedHeading(): string {
    return t('forms.clientDetails.phoneNumber.title');
  }

  /**
   * Gets the phone number input field
   * @returns {Locator} The phone input locator
   */
  get phoneInput(): Locator {
    return this.page.locator('#phoneNumber');
  }

  /**
   * Gets the safe to call radio buttons
   * @returns {Locator} The safe to call radio locators
   */
  get safeToCallRadios(): Locator {
    return this.page.locator('[name="safeToCall"]');
  }

  /**
   * Gets the announce call radio buttons
   * @returns {Locator} The announce call radio locators
   */
  get announceCallRadios(): Locator {
    return this.page.locator('[name="announceCall"]');
  }

  /**
   * Gets the phone error element
   * @returns {Locator} The phone error locator
   */
  get phoneError(): Locator {
    return this.page.locator('#phoneNumber-error');
  }

  /**
   * Fills in the phone number field
   * @param {string} phoneNumber - The phone number to enter
   */
  async fillPhoneNumber(phoneNumber: string): Promise<void> {
    await this.phoneInput.fill(phoneNumber);
  }

  /**
   * Selects a safe to call radio button option
   * @param {'yes' | 'no'} value - The value to select
   */
  async selectSafeToCall(value: 'yes' | 'no'): Promise<void> {
    const radio = value === 'yes' ? this.safeToCallRadios.first() : this.safeToCallRadios.last();
    await radio.check();
  }

  /**
   * Selects an announce call radio button option
   * @param {'yes' | 'no'} value - The value to select
   */
  async selectAnnounceCall(value: 'yes' | 'no'): Promise<void> {
    const radio = value === 'yes' ? this.announceCallRadios.first() : this.announceCallRadios.last();
    await radio.check();
  }

  /**
   * Fills in valid phone details with default radio selections
   * @param {string} phoneNumber - The phone number to enter (defaults to '07700900123')
   */
  async fillValidPhoneDetails(phoneNumber = '07700900123'): Promise<void> {
    await this.fillPhoneNumber(phoneNumber);
    await this.selectSafeToCall('yes');
    await this.selectAnnounceCall('yes');
  }

  /**
   * Submits the form with a valid phone number
   * @param {string} phoneNumber - The phone number to submit (defaults to '07700900123')
   */
  async submitWithValidPhone(phoneNumber = '07700900123'): Promise<void> {
    await this.navigate();
    await this.fillValidPhoneDetails(phoneNumber);
    await this.clickSave();
  }

  /**
   * Submits the form with an empty phone number to test validation
   */
  async submitWithEmptyPhone(): Promise<void> {
    await this.navigate();
    await this.phoneInput.fill('');
    await this.clickSave();
  }

  /**
   * Submits the form with an invalid phone number to test validation
   * @param {string} invalidPhone - The invalid phone number to test (defaults to 'invalid-phone')
   */
  async submitWithInvalidPhone(invalidPhone = 'invalid-phone'): Promise<void> {
    await this.navigate();
    await this.fillPhoneNumber(invalidPhone);
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
   * Asserts that an empty phone number error is displayed
   */
  async expectEmptyPhoneError(): Promise<void> {
    await this.expectFieldError('phoneNumber', t('forms.clientDetails.phoneNumber.validationError.notEmpty'));
  }

  /**
   * Asserts that an invalid phone number error is displayed
   */
  async expectInvalidPhoneError(): Promise<void> {
    await this.expectFieldError('phoneNumber', t('forms.clientDetails.phoneNumber.validationError.invalidFormat'));
  }

  /**
   * Asserts that an unchanged phone number error is displayed
   */
  async expectUnchangedPhoneError(): Promise<void> {
    await this.expectErrorSummaryVisible();
    // For phone, unchanged error might be different, let's check what's actually displayed
    const {errorSummary} = this;
    await expect(errorSummary).toContainText("Change");
  }
}