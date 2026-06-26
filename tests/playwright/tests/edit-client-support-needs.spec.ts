import { test, expect } from '../fixtures/index.js';
import { getClientDetailsUrlByStatus, setupAuth, assertCaseDetailsHeaderPresent, t, assertSummaryCardData, assertSummaryCardState } from '../utils/index.js';

const caseReference = 'PC-1869-9154'; // Default test case reference
const editSupportNeedsUrl = `/cases/${caseReference}/client-details/change/support-need`;
const clientDetailsUrl = getClientDetailsUrlByStatus('open');

test.beforeEach(async ({ page }) => {
  await setupAuth(page);
});

test('edit client support needs form should save valid data and redirect to client details', async ({ page, i18nSetup }) => {
  // Navigate to the edit client support needs form
  await page.goto(editSupportNeedsUrl);

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, { withMenuButtons: false, expectedName: "Grace Baker", expectedCaseRef: "PC-1869-9154", dateReceived: "8 August 2025", badgeTexts: ['At risk of abuse', 'Third Party', 'Translation', 'BSL'] });

  // Expect to see the form heading
  await expect(page.locator('legend.govuk-fieldset__legend')).toContainText('Change client support needs');

  // Check that the checkboxes are present
  const bslWebcamCheckbox = page.locator('input[name="clientSupportNeeds"][value="bslWebcam"]');
  const textRelayCheckbox = page.locator('input[name="clientSupportNeeds"][value="textRelay"]');

  await expect(bslWebcamCheckbox).toBeVisible();
  await expect(textRelayCheckbox).toBeVisible();

  // Toggle a support need (uncheck if checked, check if unchecked)
  if (await bslWebcamCheckbox.isChecked()) {
    await bslWebcamCheckbox.uncheck();
  } else {
    await bslWebcamCheckbox.check();
  }

  // Submit the form
  const saveButton = page.getByRole('button', { name: 'Save' });
  await saveButton.click();

  // Should redirect to client details page
  await expect(page).toHaveURL(clientDetailsUrl);

  // Assert support needs summary card is visible with data 
  await assertSummaryCardState(page, { cardId: 'Client support needs', emptyText: 'No support needs', hasData: true, changeHref: '/client-details/change/support-need' });
  // Assert the data in the support needs summary card is correct
  await assertSummaryCardData(page, 'Client support needs', { 'British Sign Language': 'Yes', 'Language – needs interpreter': 'English', 'Other support': 'Here are some notes from the operator!' });
  // Assert third party details summary card is visible with data
  await assertSummaryCardState(page, { cardId: 'Third party contact', emptyText: 'No third party contact required', hasData: true, changeHref: '/client-details/change/third-party', removeHref: '/confirm/remove-third-party' });
  // Assert the correct data is displayed in the third party data summary card
  await assertSummaryCardData(page, 'Third party contact', { 'Name': 'Samira Patel', 'Phone number': 'Not provided', 'Email address': 'samira@patel.com', 'Address': '84 Zoo Lane, Birmingham B88 1RW', 'Relationship to client': 'Legal adviser' });
});

test('edit client support needs form should show validation error if no option selected', async ({ page, i18nSetup }) => {
  // Navigate to the edit client support needs form
  await page.goto(editSupportNeedsUrl);

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, { withMenuButtons: false, expectedName: "Grace Baker", expectedCaseRef: "PC-1869-9154", dateReceived: "8 August 2025", badgeTexts: ['At risk of abuse', 'Third Party', 'Translation', 'BSL'] });

  // Check the box for "Other support" but do not fill in the text to trigger validation error
  const otherSupportCheckbox = page.locator('input[name="clientSupportNeeds"][value="otherSupport"]');
  await expect(otherSupportCheckbox).toBeVisible();
  await otherSupportCheckbox.check();
  const otherSupportNotesInput = page.locator('textarea[name="notes"]');
  await otherSupportNotesInput.fill('');

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


test('edit client support needs form should redirect with warning if no changes made', async ({ page }) => {
  await page.goto(editSupportNeedsUrl);
  const saveButton = page.getByRole('button', { name: t('common.save') });

  // Ensure page loaded
  await expect(page.locator('legend.govuk-fieldset__legend')).toContainText('Change client support needs');

  // Assert the existing and unchecked values 

  // BSL webcam 
  await expect(page.locator('input[value="bslWebcam"]')).toBeChecked();

  // Language selection
  await expect(page.locator('input[value="languageSelection"]')).toBeChecked();

  // Language value
  await expect(page.locator('select[name="languageSupportNeeds"]')).toHaveValue('English');

  // Other support checkbox
  await expect(page.locator('input[value="otherSupport"]')).toBeChecked();

  // Notes textarea
  await expect(page.locator('textarea[name="notes"]')).toHaveValue('Here are some notes from the operator!');

  // text relay 
  await expect(page.locator('input[value="textRelay"]')).not.toBeChecked();

  // callback preference 
  await expect(page.locator('input[value="callbackPreference"]')).not.toBeChecked();

  // Click save without making any changes
  await expect(saveButton).toBeVisible();
  await saveButton.click();

  // Check redirect to client details page
  await expect(page).toHaveURL(clientDetailsUrl);

  // Assert support needs summary card is visible with data 
  await assertSummaryCardState(page, { cardId: 'Client support needs', emptyText: 'No support needs', hasData: true, changeHref: '/client-details/change/support-need' });
  // Assert the data in the support needs summary card is correct
  await assertSummaryCardData(page, 'Client support needs', { 'British Sign Language': 'Yes', 'Language – needs interpreter': 'English', 'Other support': 'Here are some notes from the operator!' });
  // Assert third party details summary card is visible with data
  await assertSummaryCardState(page, { cardId: 'Third party contact', emptyText: 'No third party contact required', hasData: true, changeHref: '/client-details/change/third-party', removeHref: '/confirm/remove-third-party' });
  // Assert the correct data is displayed in the third party data summary card
  await assertSummaryCardData(page, 'Third party contact', { 'Name': 'Samira Patel', 'Phone number': 'Not provided', 'Email address': 'samira@patel.com', 'Address': '84 Zoo Lane, Birmingham B88 1RW', 'Relationship to client': 'Legal adviser' });

  // Assert warning message is shown
  await expect(page.getByText('No changes were made')).toBeVisible();
});


test('edit client support needs should remove all support needs when none selected', async ({ page }) => {
  const supportNeedsURL = `/cases/PC-1122-3344/client-details/change/support-need`;
  const clientDetailsURL = '/cases/PC-1122-3344/client-details';
  await page.goto(supportNeedsURL);

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, { withMenuButtons: false, expectedName: "Red Haired Shanks", expectedCaseRef: "PC-1122-3344", dateReceived: "8 August 2025", badgeTexts: ['At risk of abuse', 'Third Party', 'Translation', 'BSL'] });

  // Ensure page loaded
  await expect(page.locator('legend.govuk-fieldset__legend')).toContainText('Change client support needs');

  // Uncheck all checkboxes if checked
  const checkboxes = ['bslWebcam', 'textRelay', 'callbackPreference', 'languageSelection', 'otherSupport'];

  for (const value of checkboxes) {
    const checkbox = page.locator(`input[name="clientSupportNeeds"][value="${value}"]`);
    if (await checkbox.isVisible() && await checkbox.isChecked()) {
      await checkbox.uncheck();
    }
  }

  // Clear dependent fields
  const languageSelect = page.locator('select[name="languageSupportNeeds"]');
  if (await languageSelect.isVisible()) {
    await languageSelect.selectOption({ value: '' });
  }

  const notesField = page.locator('textarea[name="notes"]');
  if (await notesField.isVisible()) {
    await notesField.fill('');
  }

  // Submit
  await page.getByRole('button', { name: 'Save' }).click();

  // Should redirect
  await expect(page).toHaveURL(clientDetailsURL);

  // Assert EMPTY state (this is the key part)
  await assertSummaryCardState(page, { cardId: 'Client support needs', emptyText: 'No support needs', hasData: false, changeHref: '/client-details/change/support-need' });
  // Assert third party details summary card is visible with no data
  await assertSummaryCardState(page, { cardId: 'Third party contact', emptyText: 'No third party contact required', hasData: true, addHref: '/client-details/add/third-party' });
  // Assert the correct data is displayed in the third party data summary card
  await assertSummaryCardData(page, 'Third party contact', { 'Name': 'Benn Beckman', 'Phone number': 'Not provided', 'Email address': 'b.beckman@redforce.com', 'Address': 'Red Force Ship, Grand Line GL7 2RB', 'Relationship to client': 'Legal adviser' });

});
