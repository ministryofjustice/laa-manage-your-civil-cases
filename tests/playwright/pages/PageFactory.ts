import type { Page } from '@playwright/test';
import { getClientDetailsUrlByStatus } from '../utils/index.js';
import { EditNamePage } from './EditNamePage.js';
import { EditPhoneNumberPage } from './EditPhoneNumberPage.js';
import { EditDateOfBirthPage } from './EditDateOfBirthPage.js';
import { EditEmailPage } from './EditEmailPage.js';
import { LoginPage } from './LoginPage.js';
import { PendingCaseFormPage } from './PendingCaseFormPage.js';
import { CloseCaseFormPage } from './CloseCaseFormPage.js';
import { ReopenCaseFormPage } from './ReopenCaseFormPage.js';
import { ClientDetailsPage } from './ClientDetailsPage.js';

/**
 * Factory class for creating page objects for client detail edit forms
 */
export class PageFactory {
  private readonly page: Page;
  private readonly clientDetailsUrl: string;

  /**
   * Creates a new page factory instance
   * @param {Page} page - The Playwright page instance
   * @param {'new' | 'open' | 'accepted' | 'closed' | 'default'} caseStatus - The case status to use for URL generation
   */
  constructor(page: Page, caseStatus: 'new' | 'open' | 'accepted' | 'closed' | 'default' = 'default', caseId?: string) {
    this.page = page;

  if (caseId) {
    this.clientDetailsUrl = `/cases/${caseId}/client-details`;
  } else {
    this.clientDetailsUrl = getClientDetailsUrlByStatus(caseStatus);
  }

  }

  /**
   * Gets an instance of the edit name page
   * @returns {EditNamePage} The edit name page object
   */
  get editName(): EditNamePage {
    return new EditNamePage(
      this.page,
      this.clientDetailsUrl + '/change/name',
      this.clientDetailsUrl
    );
  }

  /**
   * Gets an instance of the edit phone number page
   * @returns {EditPhoneNumberPage} The edit phone number page object
   */
  get editPhoneNumber(): EditPhoneNumberPage {
    return new EditPhoneNumberPage(this.page);
  }

  /**
   * Gets an instance of the edit date of birth page
   * @returns {EditDateOfBirthPage} The edit date of birth page object
   */
  get editDateOfBirth(): EditDateOfBirthPage {
    return new EditDateOfBirthPage(this.page);
  }

  /**
   * Gets an instance of the edit email page
   * @returns {EditEmailPage} The edit email page object
   */
  get editEmail(): EditEmailPage {
    return new EditEmailPage(this.page);
  }

  /**
   * Gets an instance of the login page
   * @returns {LoginPage} The login page object
   */
  get login(): LoginPage {
    return new LoginPage(this.page);
  }

  /**
   * Extracts the case reference from the client details URL
   * @returns {string} The case reference
   * @private
   */
  private getCaseReference(): string {
    const match = this.clientDetailsUrl.match(/\/cases\/([^/]+)\//);
    if (!match) {
      throw new Error('Cannot extract case reference from URL: ' + this.clientDetailsUrl);
    }
    return match[1];
  }

  /**
   * Gets an instance of the pending case form page
   * @returns {PendingCaseFormPage} The pending case form page object
   */
  get pendingCaseForm(): PendingCaseFormPage {
    return PendingCaseFormPage.forCase(this.page, this.getCaseReference());
  }

  /**
   * Gets an instance of the close case form page
   * @returns {CloseCaseFormPage} The close case form page object
   */
  get closeCaseForm(): CloseCaseFormPage {
    return CloseCaseFormPage.forCase(this.page, this.getCaseReference());
  }

  /**
   * Gets an instance of the reopen case form page
   * @returns {ReopenCaseFormPage} The reopen case form page object
   */
  get reopenCaseForm(): ReopenCaseFormPage {
    return ReopenCaseFormPage.forCase(this.page, this.getCaseReference());
  }

  /**
   * Gets an instance of the client details page
   * @returns {ClientDetailsPage} The client details page object
   */
  get clientDetails(): ClientDetailsPage {
    return ClientDetailsPage.forCase(this.page, this.getCaseReference());
  }
}