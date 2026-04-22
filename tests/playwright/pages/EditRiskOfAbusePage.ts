import type { Page, Locator, expect } from '@playwright/test';
import { BaseEditFormPage } from './BaseEditFormPage.js';
import { t, getClientDetailsUrlByStatus } from '../utils/index.js';

/**
 * Page object for the edit client risk of abuse form
 */
export class EditRiskOfAbusePage extends BaseEditFormPage {
  
private readonly caseReference: string;

  constructor(page: Page, caseReference: string) {
    super(
      page,
      `/cases/${caseReference}/client-details/change/risk-of-abuse`,
      `/cases/${caseReference}/client-details`
    );
    this.caseReference = caseReference;
  }

  get heading(): Locator {
    return this.page.locator('h2.govuk-heading-l');
  }

  get informationText(): Locator {
    return this.page.getByText(
    'Guidance on abuse is in the Civil Legal Advice',
    { exact: false }
  );
}

  get yesRadio(): Locator {
    return this.page.locator('input[name="clientRiskOfAbuse"][value="true"]');
  }

  get noRadio(): Locator {
    return this.page.locator('input[name="clientRiskOfAbuse"][value="false"]');
  }

  get radioGroup(): Locator {
    return this.page.locator('.govuk-radios');
  }

  get saveButton(): Locator {
    return this.page.locator('button.govuk-button', { hasText: t('common.save') });
  }

  get cancelLink(): Locator {
    return this.page.locator('a.govuk-link', { hasText: t('common.cancel') });
  }

  getExpectedHeading(): string {
    return t('forms.clientDetails.riskOfAbuse.h1');
  }

    /**
   * Creates a SplitThisCaseFormPage instance for a specific case
   * @param {Page} page - The Playwright page instance
   * @param {string} caseReference - The case reference number
   * @returns {SplitThisCaseFormPage} New 'split this case' form page instance
   */
  static forCase(page: Page, caseReference: string): EditRiskOfAbusePage {
    return new EditRiskOfAbusePage(page, caseReference);
  }

}
