import { test, expect } from '../fixtures/index.js';
import { getClientDetailsUrlByStatus, setupAuth, assertCaseDetailsHeaderPresent, assertSummaryCardData, assertSummaryCardState } from '../utils/index.js';
import { EditDateOfBirthPage } from '../pages/EditDateOfBirthPage.js';

const clientDetailsUrl = getClientDetailsUrlByStatus('default');

test.beforeEach(async ({ page }) => {
  await setupAuth(page);
});

test('viewing edit date of birth form should display expected elements', async ({ page, i18nSetup }) => {
  const editDateOfBirthPage = new EditDateOfBirthPage(page);

  // Navigate to the date of birth edit form
  await editDateOfBirthPage.navigate();

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, { withMenuButtons: false, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 July 2025", badgeTexts: ['Urgent', 'At risk of abuse', 'Third Party'] });


  // Assert all main elements are visible
  await editDateOfBirthPage.assertMainElementsVisible();
});

test('cancel link should navigate back to client details', async ({ page, i18nSetup }) => {
  const editDateOfBirthPage = new EditDateOfBirthPage(page);
  // Test cancel navigation functionality
  await editDateOfBirthPage.expectCancelNavigatesBack();
  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(editDateOfBirthPage.getPage, { withMenuButtons: true, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 July 2025", badgeTexts: ['Urgent', 'At risk of abuse', 'Third Party'] });
});

test('unchanged date of birth triggers no change warning', async ({ pages, i18nSetup }) => {
  const editDateOfBirthPage = pages.editDateOfBirth;
  await editDateOfBirthPage.navigate();
  await editDateOfBirthPage.populateOriginalDateFields('18', '8', '1981');

  await editDateOfBirthPage.clickSave();
  await editDateOfBirthPage.expectSuccessfulSubmission();
  await editDateOfBirthPage.expectNoChangeWarningBanner('No changes were made');

});

test('save button should redirect to client details when no validation errors', async ({ page, i18nSetup }) => {
  const editDateOfBirthPage = new EditDateOfBirthPage(page);

  // Navigate to the date of birth edit form
  await editDateOfBirthPage.navigate();

  // Save a valid date with change detection
  await editDateOfBirthPage.saveValidDate('15', '5', '1990');

  // Should redirect to client details
  await expect(page).toHaveURL(clientDetailsUrl);

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(editDateOfBirthPage.getPage, { withMenuButtons: true, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 July 2025", badgeTexts: ['Urgent', 'At risk of abuse', 'Third Party'] });
  
  // Assert support needs summary card is visible with no data 
  await assertSummaryCardState(page, { cardId: 'Client support needs', emptyText: 'No support needs', hasData: false, addHref: '/client-details/add/support-need' });
  // Assert third party details summary card is visible with data
  await assertSummaryCardState(page, { cardId: 'Third party contact', emptyText: 'No third party contact required', hasData: true, changeHref: '/client-details/change/third-party', removeHref: '/confirm/remove-third-party' });
  // Assert the correct data is displayed in the third party data summary card
  await assertSummaryCardData(page, 'Third party contact', { 'Name': 'Sarah Johnson', 'Phone number': 'Warning Not safe to call', 'Email address': 'sarah@johnson.com', 'Address': '45 Main Street, Sheffield S1 2AB', 'Relationship to client': 'Family member or friend' });
});

test('date of birth edit page should be accessible', {
  tag: '@accessibility',
}, async ({ page, checkAccessibility }) => {
  const editDateOfBirthPage = new EditDateOfBirthPage(page);
  await editDateOfBirthPage.navigate();
  await checkAccessibility();
});