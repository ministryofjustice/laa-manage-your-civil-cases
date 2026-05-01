
import { test, expect } from '../fixtures/index.js';
import { EditRiskOfAbusePage } from '../pages/EditRiskOfAbusePage.js';
import { ClientDetailsPage } from '../pages/index.js';
import { setupAuth, assertCaseDetailsHeaderPresent } from '../utils/index.js';

test.describe('Edit Client Risk of Abuse', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test('should display all expected form elements', async ({ page }) => {
    const riskOfAbusePage = EditRiskOfAbusePage.forCase(page, 'PC-1977-1241');
   
    await riskOfAbusePage.navigate();

    // Case header
    await assertCaseDetailsHeaderPresent(riskOfAbusePage.getPage, {
      withMenuButtons: false,
      expectedName: 'Harry Potter',
      expectedCaseRef: 'PC-1977-1241',
      dateReceived: '7 July 2025',
      badgeTexts: ['Urgent', 'At risk of abuse', 'Third Party'],
    });

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

  await clientDetailsPage.expectRiskOfAbuse('No');

});

});
