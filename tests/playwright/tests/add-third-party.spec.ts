import { test } from '../fixtures/index.js';
import { getClientDetailsUrlByStatus, setupAuth, assertCaseDetailsHeaderPresent, assertSummaryCardState, assertSummaryCardData } from '../utils/index.js';
import { ThirdPartyFormPage } from '../pages/ThirdPartyFormPage.js';


const clientDetailsUrl = getClientDetailsUrlByStatus('default');

test.beforeEach(async ({ page }) => {
  await setupAuth(page);
});

test('viewing add third party form should display expected elements', async ({ page, i18nSetup }) => {
  const thirdPartyPage = ThirdPartyFormPage.forAdd(page, clientDetailsUrl);

  // Navigate to the add third party form
  await thirdPartyPage.navigate();

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, { withMenuButtons: false, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 July 2025", badgeTexts: ['Urgent', 'At risk of abuse', 'Third Party'] });

  // Expect to see the main elements
  await thirdPartyPage.expectPageLoaded(thirdPartyPage.getExpectedHeading());
  await thirdPartyPage.expectFormElementsVisible();
});

test('cancel link should navigate back to client details', async ({ page, i18nSetup }) => {
  const thirdPartyPage = ThirdPartyFormPage.forAdd(page, clientDetailsUrl);

  // Test cancel navigation using base class method
  await thirdPartyPage.expectCancelNavigatesBack();

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, { withMenuButtons: false, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 July 2025", badgeTexts: ['Urgent', 'At risk of abuse', 'Third Party'] });
  // Assert support needs summary card is visible with no data 
  await assertSummaryCardState(page, { cardId: 'Client support needs', emptyText: 'No support needs', hasData: false, addHref: '/client-details/add/support-need' });
  // Assert third party details summary card is visible with data
  await assertSummaryCardState(page, { cardId: 'Third party contact', emptyText: 'No third party contact required', hasData: true, changeHref: '/client-details/change/third-party', removeHref: '/confirm/remove-third-party' });
  // Assert the data in the third party details summary card is correct
  await assertSummaryCardData(page, 'Third party contact', { 'Name': 'Sarah Johnson', 'Phone number': 'Warning Not safe to call', 'Email address': 'sarah@johnson.com', 'Address': '45 Main Street, Sheffield S1 2AB', 'Relationship to client': 'Family member or friend', 'Passphrase': 'TestPass123' });

});

test('save button should redirect to client details when valid data submitted', async ({ page, i18nSetup }) => {
  const thirdPartyPage = ThirdPartyFormPage.forAdd(page, '/cases/PC-1357-1212/client-details');

  // Navigate to the add third party form
  await thirdPartyPage.navigate();

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(thirdPartyPage.getPage, { withMenuButtons: false, expectedName: 'James Potter', expectedCaseRef: 'PC-1357-1212', dateReceived: '7 July 2025', badgeTexts: ['Urgent', 'At risk of abuse'], });
  // Fill in valid third party details
  await thirdPartyPage.fillValidThirdPartyData({
    name: 'John Smith',
    phone: '07700900123',
    email: 'john.smith@example.com',
    relationshipValue: 'PARENT_GUARDIAN',
    address: '76 Holyhead Road, Anglesey',
    postcode: 'LL66 6UB',
    safeToCall: true,
    hasPassphrase: false
  });

  // Submit the form
  await thirdPartyPage.clickSave();

  // Should redirect to client details page
  await thirdPartyPage.expectSuccessfulSubmission();

  // Assert support needs summary card is visible with no data 
  await assertSummaryCardState(page, { cardId: 'Client support needs', emptyText: 'No support needs', hasData: false, addHref: '/client-details/add/support-need' });
  // Assert third party details summary card is visible with data after the change
  await assertSummaryCardState(page, { cardId: 'Third party contact', emptyText: 'No third party contact required', hasData: true, changeHref: '/client-details/change/third-party', removeHref: '/confirm/remove-third-party' });
  // Assert the changes to third party details are available on client details page
  await assertSummaryCardData(page, 'Third party contact', { 'Name': 'John Smith', 'Phone number': '07700900123', 'Email address': 'john.smith@example.com', 'Address': '76 Holyhead Road, Anglesey LL66 6UB', 'Relationship to client': 'Parent or guardian' });
});

test('add third party form displays validation errors correctly', async ({ page, i18nSetup }) => {
  const thirdPartyPage = ThirdPartyFormPage.forAdd(page, clientDetailsUrl);

  // Navigate to the add third party form
  await thirdPartyPage.navigate();

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, { withMenuButtons: false, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 July 2025", badgeTexts: ['Urgent', 'At risk of abuse', 'Third Party'] });

  // Submit form with missing required fields
  await thirdPartyPage.clearNameField();
  await thirdPartyPage.clickSave();

  // Check GOV.UK error summary appears
  await thirdPartyPage.expectErrorSummaryVisible();

  // Check alert banner is not present (as this is a validation error takes priority)
  await thirdPartyPage.expectAlertBannerNotVisible();

  // Check individual field errors appear
  await thirdPartyPage.expectNameFieldError();
});