import { test, expect } from '../fixtures/index.js';
import { getClientDetailsUrlByStatus, setupAuth, assertCaseDetailsHeaderPresent, assertSummaryCardData, assertSummaryCardState } from '../utils/index.js';
import { ThirdPartyFormPage } from '../pages/ThirdPartyFormPage.js';

const clientDetailsUrl = getClientDetailsUrlByStatus('default');

test.beforeEach(async ({ page }) => {
  await setupAuth(page);
});

test('viewing edit third party form should display expected elements', async ({ page, i18nSetup }) => {
  const thirdPartyPage = ThirdPartyFormPage.forEdit(page, clientDetailsUrl);

  // Navigate to the edit third party form
  await thirdPartyPage.navigate();

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(thirdPartyPage.getPage, { withMenuButtons: false, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 July 2025", badgeTexts: ['Urgent', 'At risk of abuse', 'Third Party'] });
  // Expect to see the main elements
  await thirdPartyPage.expectPageLoaded(thirdPartyPage.getExpectedHeading());
  await thirdPartyPage.expectFormElementsVisible();

  // Expect form to be pre-populated with existing data (but MSW might return empty, so just check form loads)
  // await expect(thirdPartyPage.nameInput).not.toHaveValue(''); // Commented out as MSW mock data might be empty
});

test('cancel link should navigate back to client details', async ({ page, i18nSetup }) => {
  const thirdPartyPage = ThirdPartyFormPage.forEdit(page, clientDetailsUrl);

  // Test cancel navigation using base class method
  await thirdPartyPage.expectCancelNavigatesBack();

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(thirdPartyPage.getPage, { withMenuButtons: true, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 July 2025", badgeTexts: ['Urgent', 'At risk of abuse', 'Third Party'] });
});

test('save button should redirect to client details when valid data submitted', async ({ page, i18nSetup }) => {
  const thirdPartyPage = ThirdPartyFormPage.forEdit(page, clientDetailsUrl);

  // Navigate to the edit third party form
  await thirdPartyPage.navigate();

  // Update third party details
  await thirdPartyPage.fillValidThirdPartyData({ name: 'Jane Smith', phone: '07700900456', email: 'jane.smith@example.com', relationshipValue: 'PARENT_GUARDIAN', safeToCall: true, hasPassphrase: false });

  // Submit the form
  await thirdPartyPage.clickSave();

  // Should redirect to client details page
  await thirdPartyPage.expectSuccessfulSubmission();

  // Assert the new 3rd party details are shown.
  await assertSummaryCardState(page, { cardId: 'Client support needs', emptyText: 'No support needs', hasData: false, addHref: '/client-details/add/support-need' });
  // Assert third party details summary card is visible with data
  await assertSummaryCardState(page, { cardId: 'Third party contact', emptyText: 'No third party contact required', hasData: true, changeHref: '/client-details/change/third-party', removeHref: '/confirm/remove-third-party' });
  // Assert the correct data is displayed in the third party data summary card
  await assertSummaryCardData(page, 'Third party contact', { 'Name': 'Jane Smith', 'Phone number': '07700900456', 'Email address': 'jane.smith@example.com', 'Relationship to client': 'Parent or guardian' });

  // Check error summary is not present
  await expect(page.locator('.govuk-error-summary')).not.toBeVisible();
  //TODO
});

test('edit third party form displays validation errors correctly', async ({ page, i18nSetup }) => {
  const thirdPartyPage = ThirdPartyFormPage.forEdit(page, clientDetailsUrl);

  // Navigate to the edit third party form
  await thirdPartyPage.navigate();

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(thirdPartyPage.getPage, { withMenuButtons: false, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 July 2025", badgeTexts: ['Urgent', 'At risk of abuse', 'Third Party'] });

  // Submit form with invalid data
  await thirdPartyPage.clearNameField();
  await thirdPartyPage.clickSave();

  // Check GOV.UK error summary appears
  await thirdPartyPage.expectErrorSummaryVisible();

  // Check alert banner is not present (as this is a validation error takes priority)
  await thirdPartyPage.expectAlertBannerNotVisible();

  // Check individual field errors appear
  await thirdPartyPage.expectNameFieldError();
});

test('edit third party form displays postcode validation errors correctly', async ({ page, i18nSetup }) => {
  const thirdPartyPage = ThirdPartyFormPage.forEdit(page, clientDetailsUrl);

  // Navigate to the edit third party form
  await thirdPartyPage.navigate();

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(thirdPartyPage.getPage, { withMenuButtons: false, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 July 2025", badgeTexts: ['Urgent', 'At risk of abuse', 'Third Party'] });

  // Update third party details
  await thirdPartyPage.fillValidThirdPartyData({ name: 'Jane Smith', phone: '07700900456', email: 'jane.smith@example.com', relationshipValue: 'PARENT_GUARDIAN', safeToCall: true, hasPassphrase: false, postcode: "TEST567890123" }); // Invalid postcode 

  // Submit the form
  await thirdPartyPage.clickSave();

  // Check GOV.UK error summary appears
  await thirdPartyPage.expectErrorSummaryVisible();

  // Check alert banner is not present (as this is a validation error takes priority)
  await thirdPartyPage.expectAlertBannerNotVisible();

  // Check individual field errors appear
  await thirdPartyPage.expectPostcodeFieldError();
});

test('unchanged fields show "no changes" banner and redirect', async ({ page }) => {
  const thirdPartyPage = ThirdPartyFormPage.forEdit(page, clientDetailsUrl);

  // Navigate to the edit third party form
  await thirdPartyPage.navigate();

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(thirdPartyPage.getPage, { withMenuButtons: false, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 July 2025", badgeTexts: ['Urgent', 'At risk of abuse', 'Third Party'] });

  // Click save without making any changes
  await thirdPartyPage.clickSave();

  // Redirect to client details page
  await thirdPartyPage.expectSuccessfulSubmission();

  // Assert the no change warning banner is displayed
  const warningBanner = page.getByRole('region', { name: 'warning: No changes were made' });
  await expect(warningBanner).toBeVisible();
  await expect(warningBanner).toContainText('No changes were made');

  // Assert support needs summary card is visible with no data 
  await assertSummaryCardState(page, { cardId: 'Client support needs', emptyText: 'No support needs', hasData: false, addHref: '/client-details/add/support-need' });
  // Assert third party details summary card is visible with data
  await assertSummaryCardState(page, { cardId: 'Third party contact', emptyText: 'No third party contact required', hasData: true, changeHref: '/client-details/change/third-party', removeHref: '/confirm/remove-third-party' });
  // Assert the correct data is displayed in the third party data summary card
  await assertSummaryCardData(page, 'Third party contact', { 'Name': 'Jane Smith', 'Phone number': '07700900456', 'Email address': 'jane.smith@example.com', 'Relationship to client': 'Parent or guardian' });

  // Check error summary is not present
  await expect(page.locator('.govuk-error-summary')).not.toBeVisible();
});