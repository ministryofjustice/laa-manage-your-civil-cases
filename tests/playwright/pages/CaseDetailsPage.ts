import { type Page, type Locator, expect } from '@playwright/test';
import { CaseStatusComponent } from './components/CaseStatusComponent.js';

/**
 * Page object model for the case details page
 */
export class CaseDetailsTabPage {
  private readonly page: Page;
  private readonly caseReference: string;
  private readonly statusComponent: CaseStatusComponent;

  /**
   * Creates a new case details page object
   * @param {Page} page - The Playwright page instance
   * @param {string} caseReference - The case reference number
   */
  constructor(page: Page, caseReference: string) {
    this.page = page;
    this.caseReference = caseReference;
    this.statusComponent = new CaseStatusComponent(page);
  }

  /**
   * Gets the URL for this case details page
   * @returns {string} The case details URL
   */
  get url(): string {
    return `/cases/${this.caseReference}/case-details`;
  }

  /**
   * Gets the client name heading element
   * @returns {Locator} The client name locator
   */
  get clientName(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  /**
   * Gets the heading element
   * @returns {Locator} The heading locator
   */
  get tabHeading(): Locator {
    return this.page.locator('h2.govuk-heading-m');
  }

  /**
   * Gets the link element
   * @returns {Locator} The link locator
   */
  get noteJumpLink(): Locator {
    return this.page.locator('a.govuk-link[href="#providerNote"]');
  }

  /**
   * Gets the providerNoteTextarea element
   * @returns {Locator} The providerNoteTextarea locator
   */
  get providerNoteTextarea(): Locator {
    return this.page.locator('#providerNote');
  }

  /**
   * Gets the characterCountContainerInputBox element
   * @returns {Locator} The characterCountContainer locator
   */
  get characterCountContainerInputBox(): Locator {
    return this.page.locator('[data-module="govuk-character-count"]');
  }

  /**
   * Gets the save button for provider notes
   * @returns {Locator} The save button locator
   */
  get saveButton(): Locator {
    return this.page.getByRole('button', { name: 'Save' });
  }

  /**
   * Gets the error summary component
   * @returns {Locator} The error summary locator
   */
  get errorSummary(): Locator {
    return this.page.locator('.govuk-error-summary');
  }

  /**
   * Gets the provider note field error
   * @returns {Locator} The field error locator
   */
  get providerNoteError(): Locator {
    return this.page.locator('#providerNote-error');
  }

  /**
   * Gets the character count message
   * @returns {Locator} The character count info locator
   */
  get characterCountInfo(): Locator {
    return this.page.locator('#providerNote-info');
  }

  /**
   * Gets all displayed provider notes
   * @returns {Locator} The provider notes display locator
   */
  get displayedProviderNotes(): Locator {
    return this.page.locator('.govuk-body').filter({ hasText: /.+/ });
  }

  /**
   * Navigates to the client details page
   */
  async navigate(): Promise<void> {
    await this.page.goto(this.url);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Asserts that the client name is displayed correctly
   * @param {string} name - The expected client name
   */
  async expectClientName(name: string): Promise<void> {
    await expect(this.clientName).toContainText(name);
  }

  /**
   * Asserts that the case status is displayed correctly
   * @param {string} status - The expected status
   */
  async expectStatus(status: 'New' | 'Advising' | 'Closed' | 'Pending'): Promise<void> {
    await this.statusComponent.expectStatus(status);
  }

  /**
   * Clicks the jump link to the provider note textarea
   */
  async clickJumpToProviderNote(): Promise<void> {
    await expect(this.noteJumpLink).toBeVisible();
    await this.noteJumpLink.click();
    await expect(this.page).toHaveURL(/#providerNote$/);
  }

  /**
   * Gets the operatorDiagnosisHeading, operatorNotesHeading or providerNotesHeading element
   */
  headingH3ByText(text: string): Locator {
    return this.page.getByRole('heading', {
      level: 3,
      name: text,
    });
  }

  /**
   * Fills the provider note textarea
   */
  async fillProviderNote(note: string): Promise<void> {
    await expect(this.providerNoteTextarea).toBeVisible();
    await this.providerNoteTextarea.fill(note);
  }

  /**
   * Clicks the save button
   */
  async clickSave(): Promise<void> {
    await this.saveButton.click();
  }

  /**
   * Submits a provider note
   */
  async submitProviderNote(note: string): Promise<void> {
    await this.fillProviderNote(note);
    await this.clickSave();
  }

  /**
   * Submits an empty provider note (for validation testing)
   */
  async submitEmptyProviderNote(): Promise<void> {
    await this.providerNoteTextarea.clear();
    await this.clickSave();
  }

  /**
   * Expects error summary to be visible
   */
  async expectErrorSummaryVisible(): Promise<void> {
    await expect(this.errorSummary).toBeVisible();
  }

  /**
   * Expects successful submission (redirect back to case details)
   */
  async expectSuccessfulSubmission(): Promise<void> {
    await this.page.waitForURL(this.url);
    await expect(this.page).toHaveURL(this.url);
  }

  /**
   * Expects a specific validation error message
   */
  async expectValidationError(message: string): Promise<void> {
    await expect(this.errorSummary).toContainText(message);
    await expect(this.providerNoteError).toBeVisible();
  }

  /**
   * Creates a new CaseDetailsTabPage instance for a specific case
   * @param {Page} page - The Playwright page instance
   * @param {string} caseReference - The case reference number
   * @returns {CaseDetailsTabPage} New client details page instance
   */
  static forCase(page: Page, caseReference: string): CaseDetailsTabPage {
    return new CaseDetailsTabPage(page, caseReference);
  }
}
