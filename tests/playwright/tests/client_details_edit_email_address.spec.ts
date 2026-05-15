import { test } from '../fixtures/index.js';
import { setupAuth, assertCaseDetailsHeaderPresent } from '../utils/index.js';
import { EditEmailPage } from '../pages/EditEmailPage.js';

test.beforeEach(async ({ page }) => {
  await setupAuth(page);
});

test('viewing change email-address form, to see the expected elements', async ({ page, i18nSetup }) => {
  const editEmailPage = new EditEmailPage(page);

  // Navigate to the email edit form
  await editEmailPage.navigate();

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, { withMenuButtons: false, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 July 2025", badgeTexts: ['Urgent', 'At risk of abuse', 'Third Party'] }); 

  // Assert all main elements are visible
  await editEmailPage.assertMainElementsVisible();
});

test('change email address form displays validation errors correctly', async ({ page, i18nSetup }) => {
  const editEmailPage = new EditEmailPage(page);

  // Navigate to the change form and test validation
  await editEmailPage.navigate();
  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, { withMenuButtons: false, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 July 2025", badgeTexts: ['Urgent', 'At risk of abuse', 'Third Party'] }); 
  
  await editEmailPage.assertInvalidEmailValidation('JackYoungs.com');
});

test('shows warning banner when email is not changed', async ({ page, i18nSetup }) => {
  const editEmailPage = new EditEmailPage(page);

  await editEmailPage.navigate();

  await assertCaseDetailsHeaderPresent(page, {
    withMenuButtons: false,
    expectedName: "Jack Youngs",
    expectedCaseRef: "PC-1922-1879",
    dateReceived: "7 July 2025",
    badgeTexts: ['Urgent', 'At risk of abuse', 'Third Party']
  });

  await editEmailPage.waitForLoad();

  await editEmailPage.submitUnchangedEmail();

  // assert redirect
  await editEmailPage.expectSuccessfulSubmission();

  // assert warning banner 
  await editEmailPage.expectNoChangeWarningBanner('No changes were made');
});

test('email address edit page should be accessible', {
  tag: '@accessibility',
}, async ({ page, checkAccessibility }) => {
  const editEmailPage = new EditEmailPage(page);
  await editEmailPage.navigate();
  await checkAccessibility();
});