
import { test, expect } from '../fixtures/index.js';
import { EditRiskOfAbusePage } from '../pages/EditRiskOfAbusePage.js';
import { ClientDetailsPage } from '../pages/index.js';
import { setupAuth, assertCaseDetailsHeaderPresent, assertSummaryCardData, assertSummaryCardState } from '../utils/index.js';

test.describe('Edit Client Risk of Abuse', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test('should display all expected form elements', async ({ page }) => {
    const riskOfAbusePage = EditRiskOfAbusePage.forCase(page, 'PC-1977-1241');

    await riskOfAbusePage.navigate();

    // Case header
    await assertCaseDetailsHeaderPresent(riskOfAbusePage.getPage, { withMenuButtons: false, expectedName: 'Harry Potter', expectedCaseRef: 'PC-1977-1241', dateReceived: '7 July 2025', badgeTexts: ['Urgent', 'At risk of abuse'], });

    // Heading
    await expect(riskOfAbusePage.heading).toHaveText(riskOfAbusePage.getExpectedHeading());

    // Informational text
    await expect(riskOfAbusePage.informationText).toBeVisible();

    // Radios
    await expect(riskOfAbusePage.radioGroup).toBeVisible();
    await expect(riskOfAbusePage.yesRadio).toBeVisible();
    await expect(riskOfAbusePage.noRadio).toBeVisible();

    // Radios should be unchecked initially (or change if defaulted)
    await expect(riskOfAbusePage.yesRadio).toBeChecked();
    await expect(riskOfAbusePage.noRadio).not.toBeChecked();

    // Buttons
    await expect(riskOfAbusePage.saveButton).toBeVisible();
    await expect(riskOfAbusePage.cancelLink).toBeVisible();
  });


test('saving updates vulnerable_user to No', async ({ page }) => {
  const caseRef = 'PC-1977-1241';

    const riskOfAbusePage = EditRiskOfAbusePage.forCase(page, caseRef);
    await riskOfAbusePage.navigate();

    // Precondition
    await expect(riskOfAbusePage.yesRadio).toBeChecked();

    // Change value
    await riskOfAbusePage.noRadio.check();
    await riskOfAbusePage.saveButton.click();

    // Redirect happened
    const clientDetailsPage = ClientDetailsPage.forCase(page, caseRef);
    await expect(page).toHaveURL(clientDetailsPage.url);

    // Assert support needs summary card is visible with no data 
    await assertSummaryCardState(page, { cardId: 'Client support needs', emptyText: 'No support needs', hasData: true, changeHref: '/client-details/change/support-need' });
    // Assert the data in the support needs summary card is correct
    await assertSummaryCardData(page, 'Client support needs', { 'British Sign Language': 'Yes' });
    // Assert third party details summary card is visible with data
    await assertSummaryCardState(page, { cardId: 'Third party contact', emptyText: 'No third party contact required', hasData: true, changeHref: '/client-details/change/third-party', removeHref: '/confirm/remove-third-party' });
    // Assert the data in the third party summary card is correct
    await assertSummaryCardData(page, 'Third party contact', { 'Name': 'Sarah Johnson', 'Phone number': '0787123456', 'Email address': 'sarah@johnson.com', 'Address': '45 Main Street, Sheffield S1 2AB', 'Relationship to client': 'Family member or friend', 'Passphrase': 'TestPass123' });

    await clientDetailsPage.expectRiskOfAbuse('No');
  });
});
