import { test, expect } from '../fixtures/index.js';
import { t, getClientDetailsUrlByStatus } from '../utils/index.js';

// // Remove third party is a case route, not a client-details route, so we need to build the URL differently
// const caseReference = 'PC-1922-1879'; // Default test case reference
// const visitUrl = `/cases/${caseReference}/confirm/remove-third-party`;
// const clientDetailsUrl = getClientDetailsUrlByStatus('default');

// test('viewing remove third party confirmation should display expected elements', async ({ page, i18nSetup }) => {
//   const confirmButton = page.getByRole('button', { name: 'Yes, remove' });
//   const cancelButton = page.getByRole('button', { name: 'No, go back to client details' }); // It's a button, not a link

//   // Navigate to the remove third party confirmation
//   await page.goto(visitUrl);

//   // Expect to see the main elements
//   await expect(page.locator('h1')).toContainText('Remove third party?'); // Use actual text
//   await expect(confirmButton).toBeVisible();
//   await expect(cancelButton).toBeVisible();

//   // Check for warning text or description
//   await expect(page.getByText('permanently delete')).toBeVisible();
// });

// test('cancel link should navigate back to client details', async ({ page, i18nSetup }) => {
//   const cancelButton = page.getByRole('button', { name: 'No, go back to client details' }); // It's a button, not a link

//   // Navigate to the remove third party confirmation
//   await page.goto(visitUrl);

//   // Click cancel button
//   await cancelButton.click();

//   // Should navigate back to client details
//   await expect(page).toHaveURL(clientDetailsUrl);
// });

// test('confirm button should delete third party and redirect to client details', async ({ page, i18nSetup }) => {
//   const confirmButton = page.getByRole('button', { name: 'Yes, remove' });

//   // Navigate to the remove third party confirmation
//   await page.goto(visitUrl);

//   // Click confirm button
//   await expect(confirmButton).toBeVisible();
//   await confirmButton.click();

//   // Should redirect to client details page
//   await expect(page).toHaveURL(clientDetailsUrl);
// });

// test('confirmation page shows warning text about removing third party', async ({ page, i18nSetup }) => {
//   // Navigate to the remove third party confirmation
//   await page.goto(visitUrl);

//   // Check the page heading
//   await expect(page.locator('h1')).toContainText('Remove third party?');
  
//   // Check the warning description text
//   await expect(page.getByText('permanently delete')).toBeVisible();
// });