import { test, expect } from '../fixtures/index.js';
import { getClientDetailsUrlByStatus, setupAuth } from '../utils/index.js';

const caseReference = 'PC-1869-9154'; // Default test case reference
const editSupportNeedsUrl = `/cases/${caseReference}/client-details/change/support-need`;
const clientDetailsUrl = getClientDetailsUrlByStatus('open');

test.beforeEach(async ({ page }) => {
  await setupAuth(page);
});

test('edit client support needs form should save valid data and redirect to client details', async ({ page, i18nSetup }) => {
  // Navigate to the edit client support needs form
  await page.goto(editSupportNeedsUrl);

  // Expect to see the form heading
  await expect(page.locator('h1')).toContainText('Change client support needs');

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
});
