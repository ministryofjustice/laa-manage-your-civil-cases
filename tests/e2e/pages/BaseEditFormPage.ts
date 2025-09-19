import { Page, Locator, expect } from '@playwright/test';
import { t } from '../helpers/index.js';

export abstract class BaseEditFormPage {
  protected page: Page;
  protected formUrl: string;
  protected clientDetailsUrl: string;

  constructor(page: Page, formUrl: string, clientDetailsUrl: string) {
    this.page = page;
    this.formUrl = formUrl;
    this.clientDetailsUrl = clientDetailsUrl;
  }

  // Common elements across all edit forms
  get heading(): Locator {
    return this.page.locator('h1');
  }

  get saveButton(): Locator {
    return this.page.getByRole('button', { name: t('common.save') });
  }

  get cancelLink(): Locator {
    return this.page.getByRole('link', { name: t('common.cancel') });
  }

  get backLink(): Locator {
    return this.page.locator('.govuk-back-link');
  }

  get errorSummary(): Locator {
    return this.page.locator('.govuk-error-summary');
  }

  // Common actions
  async navigate(): Promise<void> {
    await this.page.goto(this.formUrl);
  }

  async clickSave(): Promise<void> {
    await this.saveButton.click();
  }

  async clickCancel(): Promise<void> {
    await this.cancelLink.click();
  }

  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  // Common assertions
  async expectPageLoaded(expectedHeading: string): Promise<void> {
    await expect(this.heading).toContainText(expectedHeading);
    await expect(this.saveButton).toBeVisible();
    await expect(this.cancelLink).toBeVisible();
  }

  async expectCancelNavigatesBack(): Promise<void> {
    await this.navigate();
    await this.clickCancel();
    await expect(this.page).toHaveURL(this.clientDetailsUrl);
  }

  async expectErrorSummaryVisible(): Promise<void> {
    await expect(this.errorSummary).toBeVisible();
  }

  async expectFieldError(fieldId: string, expectedMessage: string): Promise<void> {
    // Check error summary link
    const errorLink = this.page.locator(`a[href="#${fieldId}"]`);
    await expect(errorLink).toBeVisible();
    await expect(errorLink).toHaveText(expectedMessage);
    
    // Check field has error styling
    const field = this.page.locator(`#${fieldId}`);
    await expect(field).toHaveClass(/govuk-input--error/);
  }

  async expectSuccessfulSubmission(): Promise<void> {
    await expect(this.page).toHaveURL(this.clientDetailsUrl);
  }

  // Abstract method that each specific page must implement
  abstract getExpectedHeading(): string;
}