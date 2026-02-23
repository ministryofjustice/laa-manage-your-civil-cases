import { test, expect } from '../fixtures/index.js';
import { getClientDetailsUrlByStatus, setupAuth, assertCaseDetailsHeaderPresent } from '../utils/index.js';

const caseReference = 'PC-1922-1879'; // Default test case reference
const addSupportNeedsUrl = `/cases/${caseReference}/client-details/add/support-need`;
const clientDetailsUrl = getClientDetailsUrlByStatus('default');

test.beforeEach(async ({ page }) => {
  await setupAuth(page);
});

test('add client support needs form should save valid data and redirect to client details', async ({ page, i18nSetup }) => {
  // Navigate to the add client support needs form
  await page.goto(addSupportNeedsUrl);

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, { withMenuButtons: false, isUrgent: true, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 Jul 2025" }); 

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
  await expect(page).toHaveURL(clientDetailsUrl);
});
