import type { Page } from '@playwright/test';
import { getClientDetailsUrlByStatus } from '../utils/index.js';
import { EditNamePage } from './EditNamePage.js';
import { EditPhoneNumberPage } from './EditPhoneNumberPage.js';
import { EditDateOfBirthPage } from './EditDateOfBirthPage.js';
import { EditEmailPage } from './EditEmailPage.js';

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
  constructor(page: Page, caseStatus: 'new' | 'open' | 'accepted' | 'closed' | 'default' = 'default') {
    this.page = page;
    this.clientDetailsUrl = getClientDetailsUrlByStatus(caseStatus);
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
}