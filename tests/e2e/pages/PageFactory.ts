import { Page } from '@playwright/test';
import { getClientDetailsUrlByStatus } from '../helpers/index.js';
import { EditNamePage } from './EditNamePage.js';

export class PageFactory {
  private page: Page;
  private clientDetailsUrl: string;

  constructor(page: Page, caseStatus: 'new' | 'open' | 'accepted' | 'closed' | 'default' = 'default') {
    this.page = page;
    this.clientDetailsUrl = getClientDetailsUrlByStatus(caseStatus);
  }

  get editName(): EditNamePage {
    return new EditNamePage(
      this.page,
      this.clientDetailsUrl + '/change/name',
      this.clientDetailsUrl
    );
  }

  // Future page objects can be added here:
  // get editPhoneNumber(): EditPhoneNumberPage { ... }
  // get editDateOfBirth(): EditDateOfBirthPage { ... }
}