import { test, expect } from '../fixtures/index.js';
import { getClientDetailsUrlByStatus, setupAuth, assertCaseDetailsHeaderPresent, assertSummaryCardState, assertSummaryCardData } from '../utils/index.js';

const caseReference = 'PC-1922-1879'; // Default test case reference
const addSupportNeedsUrl = `/cases/${caseReference}/client-details/add/support-need`;
const clientDetailsUrl = getClientDetailsUrlByStatus('default');

test.beforeEach(async ({ page }) => {
  await setupAuth(page);
});

test('add client support needs form should save valid data and redirect to client details', async ({ page, i18nSetup }) => {
  // Navigate to the add client support needs form\
  await page.goto('/cases/PC-1977-1241/client-details/add/support-need');

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, { withMenuButtons: false, expectedName: 'Harry Potter', expectedCaseRef: 'PC-1977-1241', dateReceived: '7 July 2025', badgeTexts: ['Urgent', 'At risk of abuse'], });
  
  // Expect to see the form heading
  await expect(page.locator('legend.govuk-fieldset__legend')).toContainText('Add a client support need');

  // Check that the checkboxes are present
  const bslWebcamCheckbox = page.locator('input[name="clientSupportNeeds"][value="bslWebcam"]');
  const textRelayCheckbox = page.locator('input[name="clientSupportNeeds"][value="textRelay"]');

  await expect(bslWebcamCheckbox).toBeVisible();
  await expect(textRelayCheckbox).toBeVisible();

  // Select a support need
  await bslWebcamCheckbox.check();

  // Submit the form
  const saveButton = page.getByRole('button', { name: 'Save' });
  await saveButton.click();

  // Should redirect to client details page
  await expect(page).toHaveURL('/cases/PC-1977-1241/client-details');
  // Assert support needs summary card is visible with data 
  await assertSummaryCardState(page, { cardId: 'Client support needs', emptyText: 'No support needs', hasData: true, changeHref: '/client-details/change/support-need'});
  // Assert the data in the support needs summary card is correct
  await assertSummaryCardData(page, 'Client support needs', { 'British Sign Language': 'Yes' });
  // Assert third party details summary card is visible with no data
  await assertSummaryCardState(page, { cardId: 'Third party contact', emptyText: 'No third party contact required', hasData: false, addHref: '/client-details/add/third-party' });
});

test('add client support needs form should show validation error if no option selected', async ({ page, i18nSetup }) => {
  // Navigate to the add client support needs form
  await page.goto(addSupportNeedsUrl);

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, { withMenuButtons: false, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 July 2025", badgeTexts: ['Urgent', 'At risk of abuse', 'Third Party'] });

  // Check the box for "Other support" but do not fill in the text to trigger validation error
  const otherSupportCheckbox = page.locator('input[name="clientSupportNeeds"][value="otherSupport"]');
  await expect(otherSupportCheckbox).toBeVisible();
  await otherSupportCheckbox.check();

  // Submit the form without selecting any options
  const saveButton = page.getByRole('button', { name: 'Save' });
  await saveButton.click();

  // Check GOV.UK error summary appears
  const errorSummary = page.locator('.govuk-error-summary');
  await expect(errorSummary).toBeVisible();

  // Check alert banner is not present (as this is a validation error takes priority)
  const alertBanner = page.locator('.govuk-notification-banner');
  await expect(alertBanner).not.toBeVisible();
});

test('when a client has no support needs a support needs summary card with an Add link is shown', async ({ page, i18nSetup }) => {
  const clientDetailsUrl = `/cases/PC-1924-9560/client-details`;

  // Navigate to client details screen
  await page.goto(clientDetailsUrl);

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, { withMenuButtons: true, expectedName: "Lisa NO NOTES Chen", expectedCaseRef: "PC-1924-9560", dateReceived: "15 January 2025", badgeTexts: ['Third Party'] });

  // Assert support needs summary card is visible with no data 
  await assertSummaryCardState(page, { cardId: 'Client support needs', emptyText: 'No support needs', hasData: false, addHref: '/client-details/add/support-need' });
  // Assert third party details summary card is visible with data
  await assertSummaryCardState(page, { cardId: 'Third party contact', emptyText: 'No third party contact required', hasData: true, changeHref: '/client-details/change/third-party', removeHref: '/confirm/remove-third-party' });
  // Assert the data in the third party details summary card is correct
  await assertSummaryCardData(page, 'Third party contact', { 'Name': 'Alex Rivers', 'Phone number': '0784104271', 'Email address': 'alex@rivers.com', 'Address': '84 Zoo Lane, Birmingham B88 1RW', 'Relationship to client': 'Parent or guardian', 'Passphrase': 'LetMeIn' });
});