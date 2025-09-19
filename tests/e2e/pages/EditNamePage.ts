import { Locator } from '@playwright/test';
import { BaseEditFormPage } from './BaseEditFormPage.js';
import { t } from '../helpers/index.js';

export class EditNamePage extends BaseEditFormPage {
  get nameInput(): Locator {
    return this.page.locator('#fullName');
  }

  get nameError(): Locator {
    return this.page.locator('#fullName-error');
  }

  getExpectedHeading(): string {
    return t('forms.clientDetails.name.title');
  }

  async fillName(name: string): Promise<void> {
    await this.nameInput.fill(name);
  }

  async clearName(): Promise<void> {
    await this.nameInput.fill('');
  }

  async submitWithValidName(name = 'John Updated Smith'): Promise<void> {
    await this.navigate();
    await this.fillName(name);
    await this.clickSave();
  }

  async submitWithEmptyName(): Promise<void> {
    await this.navigate();
    await this.clearName();
    await this.clickSave();
  }

  async submitWithoutChanges(): Promise<void> {
    await this.navigate();
    await this.waitForLoad();
    await this.clickSave();
  }

  async expectEmptyNameError(): Promise<void> {
    await this.expectFieldError('fullName', t('forms.clientDetails.name.validationError.notEmpty'));
  }

  async expectUnchangedNameError(): Promise<void> {
    await this.expectFieldError('fullName', t('forms.clientDetails.name.validationError.notChanged'));
  }
}