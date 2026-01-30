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
    return this.page.locator('h2.govuk-heading-s').first();
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
   * Creates a new CaseDetailsTabPage instance for a specific case
   * @param {Page} page - The Playwright page instance
   * @param {string} caseReference - The case reference number
   * @returns {CaseDetailsTabPage} New client details page instance
   */
  static forCase(page: Page, caseReference: string): CaseDetailsTabPage {
    return new CaseDetailsTabPage(page, caseReference);
  }
}
