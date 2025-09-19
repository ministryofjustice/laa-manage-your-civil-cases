import { Page } from '@playwright/test';
import { getClientDetailsUrlByStatus } from '../helpers/index.js';
import { EditNamePage } from './EditNamePage.js';
import { EditPhoneNumberPage } from './EditPhoneNumberPage.js';
import { EditDateOfBirthPage } from './EditDateOfBirthPage.js';
import { EditEmailPage } from './EditEmailPage.js';

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

  get editPhoneNumber(): EditPhoneNumberPage {
    return new EditPhoneNumberPage(this.page);
  }

  get editDateOfBirth(): EditDateOfBirthPage {
    return new EditDateOfBirthPage(this.page);
  }

  get editEmail(): EditEmailPage {
    return new EditEmailPage(this.page);
  }
}