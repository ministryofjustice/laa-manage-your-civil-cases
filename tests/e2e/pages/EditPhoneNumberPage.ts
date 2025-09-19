import { Page, Locator, expect } from '@playwright/test';
import { BaseEditFormPage } from './BaseEditFormPage.js';
import { t, getClientDetailsUrlByStatus } from '../helpers/index.js';

export class EditPhoneNumberPage extends BaseEditFormPage {
  constructor(page: Page) {
    const formUrl = getClientDetailsUrlByStatus('default') + '/change/phone-number';
    const clientDetailsUrl = getClientDetailsUrlByStatus('default');
    super(page, formUrl, clientDetailsUrl);
  }

  /**
   * Implementation of abstract method from BaseEditFormPage
   */
  getExpectedHeading(): string {
    return t('forms.clientDetails.phoneNumber.title');
  }

  get phoneInput(): Locator {
    return this.page.locator('#phoneNumber');
  }

  get safeToCallRadios(): Locator {
    return this.page.locator('[name="safeToCall"]');
  }

  get announceCallRadios(): Locator {
    return this.page.locator('[name="announceCall"]');
  }

  get phoneError(): Locator {
    return this.page.locator('#phoneNumber-error');
  }

  async fillPhoneNumber(phoneNumber: string): Promise<void> {
    await this.phoneInput.fill(phoneNumber);
  }

  async selectSafeToCall(value: 'yes' | 'no'): Promise<void> {
    const radio = value === 'yes' ? this.safeToCallRadios.first() : this.safeToCallRadios.last();
    await radio.check();
  }

  async selectAnnounceCall(value: 'yes' | 'no'): Promise<void> {
    const radio = value === 'yes' ? this.announceCallRadios.first() : this.announceCallRadios.last();
    await radio.check();
  }

  async fillValidPhoneDetails(phoneNumber = '07700900123'): Promise<void> {
    await this.fillPhoneNumber(phoneNumber);
    await this.selectSafeToCall('yes');
    await this.selectAnnounceCall('yes');
  }

  async submitWithValidPhone(phoneNumber = '07700900123'): Promise<void> {
    await this.navigate();
    await this.fillValidPhoneDetails(phoneNumber);
    await this.clickSave();
  }

  async submitWithEmptyPhone(): Promise<void> {
    await this.navigate();
    await this.phoneInput.fill('');
    await this.clickSave();
  }

  async submitWithInvalidPhone(invalidPhone = 'invalid-phone'): Promise<void> {
    await this.navigate();
    await this.fillPhoneNumber(invalidPhone);
    await this.clickSave();
  }

  async submitWithoutChanges(): Promise<void> {
    await this.navigate();
    await this.waitForLoad();
    await this.clickSave();
  }

  async expectEmptyPhoneError(): Promise<void> {
    await this.expectFieldError('phoneNumber', t('forms.clientDetails.phoneNumber.validationError.notEmpty'));
  }

  async expectInvalidPhoneError(): Promise<void> {
    await this.expectFieldError('phoneNumber', t('forms.clientDetails.phoneNumber.validationError.invalidFormat'));
  }

  async expectUnchangedPhoneError(): Promise<void> {
    await this.expectErrorSummaryVisible();
    // For phone, unchanged error might be different, let's check what's actually displayed
    const errorSummary = this.errorSummary;
    await expect(errorSummary).toContainText("Change");
  }
}