import { test } from '../fixtures/index.js';
import { getClientDetailsUrlByStatus, setupAuth, assertCaseDetailsHeaderPresent } from '../utils/index.js';
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
  await assertCaseDetailsHeaderPresent(page, { withMenuButtons: false, isUrgent: true, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 Jul 2025" }); 
  
  // Expect to see the main elements
  await thirdPartyPage.expectPageLoaded(thirdPartyPage.getExpectedHeading());
  await thirdPartyPage.expectFormElementsVisible();
});

test('cancel link should navigate back to client details', async ({ page, i18nSetup }) => {
  const thirdPartyPage = ThirdPartyFormPage.forAdd(page, clientDetailsUrl);

  // Test cancel navigation using base class method
  await thirdPartyPage.expectCancelNavigatesBack();

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, { withMenuButtons: false, isUrgent: true, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 Jul 2025" }); 
  
});

test('save button should redirect to client details when valid data submitted', async ({ page, i18nSetup }) => {
  const thirdPartyPage = ThirdPartyFormPage.forAdd(page, clientDetailsUrl);

  // Navigate to the add third party form
  await thirdPartyPage.navigate();

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, { withMenuButtons: false, isUrgent: true, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 Jul 2025" }); 

  // Fill in valid third party details
  await thirdPartyPage.fillValidThirdPartyData({
    name: 'John Smith',
    phone: '07700900123',
    email: 'john.smith@example.com',
    relationshipValue: 'PARENT_GUARDIAN',
    safeToCall: true,
    hasPassphrase: false
  });

  // Submit the form
  await thirdPartyPage.clickSave();

  // Should redirect to client details page
  await thirdPartyPage.expectSuccessfulSubmission();
});

test('add third party form displays validation errors correctly', async ({ page, i18nSetup }) => {
  const thirdPartyPage = ThirdPartyFormPage.forAdd(page, clientDetailsUrl);

  // Navigate to the add third party form
  await thirdPartyPage.navigate();

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, { withMenuButtons: false, isUrgent: true, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 Jul 2025" }); 
  
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