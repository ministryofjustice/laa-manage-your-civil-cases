import { type Page, type Locator, expect } from '@playwright/test';
import { BaseEditFormPage } from './BaseEditFormPage.js';
import { t } from '../utils/index.js';

/**
 * Page object model for third party form pages (both add and edit)
 */
export class ThirdPartyFormPage extends BaseEditFormPage {
  private formType: 'add' | 'edit';

  /**
   * Creates a new third party form page object
   * @param {Page} page - The Playwright page instance
   * @param {string} formUrl - The URL of the form (add or edit)
   * @param {string} clientDetailsUrl - The URL to redirect to after successful submission
   * @param {'add' | 'edit'} formType - Whether this is an add or edit form
   */
  constructor(page: Page, formUrl: string, clientDetailsUrl: string, formType: 'add' | 'edit') {
    super(page, formUrl, clientDetailsUrl);
    this.formType = formType;
  }

  // Third party specific form elements
  /**
   * Gets the full name input field
   * @returns {Locator} The full name input locator
   */
  get nameInput(): Locator {
    return this.page.locator('#thirdPartyFullName');
  }

  /**
   * Gets the relationship radio buttons
   * @returns {Locator} The relationship radio buttons locator
   */
  get relationshipRadios(): Locator {
    return this.page.locator('[name="thirdPartyRelationshipToClient"]');
  }

  /**
   * Gets the phone number input field
   * @returns {Locator} The phone number input locator
   */
  get phoneInput(): Locator {
    return this.page.locator('#thirdPartyContactNumber');
  }

  /**
   * Gets the email address input field
   * @returns {Locator} The email address input locator
   */
  get emailInput(): Locator {
    return this.page.locator('#thirdPartyEmailAddress');
  }

  /**
   * Gets the safe to call radio buttons
   * @returns {Locator} The safe to call radio buttons locator
   */
  get safeToCallRadios(): Locator {
    return this.page.locator('[name="thirdPartySafeToCall"]');
  }

  /**
   * Gets the passphrase setup radio buttons
   * @returns {Locator} The passphrase setup radio buttons locator
   */
  get passphraseRadios(): Locator {
    return this.page.locator('[name="thirdPartyPassphraseSetUp"]');
  }

  /**
   * Gets the address textarea field
   * @returns {Locator} The address textarea locator
   */
  get addressInput(): Locator {
    return this.page.locator('#thirdPartyAddress');
  }

  /**
   * Gets the postcode input field
   * @returns {Locator} The postcode input locator
   */
  get postcodeInput(): Locator {
    return this.page.locator('#thirdPartyPostcode');
  }

  /**
   * Gets the passphrase input field (if visible)
   * @returns {Locator} The passphrase input locator
   */
  get passphraseInput(): Locator {
    return this.page.locator('#thirdPartyPassphrase');
  }

  // Third party specific actions
  /**
   * Fills all required third party form fields with valid data
   * @param {object} data - The third party data to fill
   * @param {string} data.name - Full name
   * @param {string} data.phone - Phone number
   * @param {string} data.email - Email address
   * @param {number} data.relationshipIndex - Index of relationship option to select (default: 0)
   * @param {boolean} data.safeToCall - Whether safe to call (default: true)
   * @param {boolean} data.hasPassphrase - Whether passphrase is set up (default: false)
   * @param {string} data.address - Address (optional)
   * @param {string} data.postcode - Postcode (optional)
   * @param {string} data.passphrase - Passphrase (optional, only if hasPassphrase is true)
   */
  async fillValidThirdPartyData(data: {
    name: string;
    phone: string;
    email: string;
    relationshipIndex?: number;
    safeToCall?: boolean;
    hasPassphrase?: boolean;
    address?: string;
    postcode?: string;
    passphrase?: string;
  }): Promise<void> {
    // Fill basic required fields
    await this.nameInput.fill(data.name);
    await this.phoneInput.fill(data.phone);
    await this.emailInput.fill(data.email);

    // Select relationship (default to first option)
    const relationshipIndex = data.relationshipIndex ?? 0;
    await this.relationshipRadios.nth(relationshipIndex).check();

    // Set safe to call (default to true/Yes)
    const safeToCallIndex = data.safeToCall !== false ? 0 : 1; // 0 = Yes, 1 = No
    await this.safeToCallRadios.nth(safeToCallIndex).check();

    // Set passphrase setup (default to false/No)
    const passphraseIndex = data.hasPassphrase === true ? 0 : 1; // 0 = Yes, 1 = No
    await this.passphraseRadios.nth(passphraseIndex).check();

    // Fill optional fields if provided
    if (data.address) {
      await this.addressInput.fill(data.address);
    }

    if (data.postcode) {
      await this.postcodeInput.fill(data.postcode);
    }

    if (data.hasPassphrase && data.passphrase) {
      await this.passphraseInput.fill(data.passphrase);
    }
  }

  /**
   * Clears the name field (useful for validation testing)
   */
  async clearNameField(): Promise<void> {
    await this.nameInput.fill('');
  }

  // Third party specific assertions
  /**
   * Asserts that all expected form elements are visible
   */
  async expectFormElementsVisible(): Promise<void> {
    await expect(this.nameInput).toBeVisible();
    await expect(this.relationshipRadios.first()).toBeVisible();
    await expect(this.phoneInput).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.safeToCallRadios.first()).toBeVisible();
    await expect(this.passphraseRadios.first()).toBeVisible();
    await expect(this.saveButton).toBeVisible();
    await expect(this.cancelLink).toBeVisible();
  }

  /**
   * Asserts that the name field has a validation error
   */
  async expectNameFieldError(): Promise<void> {
    const nameError = this.page.locator('#thirdPartyFullName-error');
    await expect(nameError).toBeVisible();
  }

  /**
   * Returns the expected heading text based on form type
   * @returns {string} The expected heading text
   */
  getExpectedHeading(): string {
    return this.formType === 'add' 
      ? 'Add a third party contact'
      : 'Change details about a third party';
  }

  /**
   * Creates a new ThirdPartyFormPage instance for adding third party
   * @param {Page} page - The Playwright page instance
   * @param {string} clientDetailsUrl - The client details URL
   * @returns {ThirdPartyFormPage} New add third party page instance
   */
  static forAdd(page: Page, clientDetailsUrl: string): ThirdPartyFormPage {
    const addUrl = `${clientDetailsUrl}/add/third-party`;
    return new ThirdPartyFormPage(page, addUrl, clientDetailsUrl, 'add');
  }

  /**
   * Creates a new ThirdPartyFormPage instance for editing third party
   * @param {Page} page - The Playwright page instance
   * @param {string} clientDetailsUrl - The client details URL
   * @returns {ThirdPartyFormPage} New edit third party page instance
   */
  static forEdit(page: Page, clientDetailsUrl: string): ThirdPartyFormPage {
    const editUrl = `${clientDetailsUrl}/change/third-party`;
    return new ThirdPartyFormPage(page, editUrl, clientDetailsUrl, 'edit');
  }
}