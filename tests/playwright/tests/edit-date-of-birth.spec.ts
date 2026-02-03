import { test, expect } from '../fixtures/index.js';
import { t, getClientDetailsUrlByStatus, setupAuth, assertCaseDetailsHeaderPresent } from '../utils/index.js';
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
  await assertCaseDetailsHeaderPresent(page, false, "Jack Youngs", "PC-1922-1879", "7 Jul 2025"); 

  // Assert all main elements are visible
  await editDateOfBirthPage.assertMainElementsVisible();
});

test('cancel link should navigate back to client details', async ({ page, i18nSetup }) => {
  const editDateOfBirthPage = new EditDateOfBirthPage(page);
  // Test cancel navigation functionality
  await editDateOfBirthPage.expectCancelNavigatesBack();
  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(editDateOfBirthPage.getPage, true, "Jack Youngs", "PC-1922-1879", "7 Jul 2025"); 


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
  await assertCaseDetailsHeaderPresent(editDateOfBirthPage.getPage, true, "Jack Youngs", "PC-1922-1879", "7 Jul 2025"); 

});

test('date of birth edit page should be accessible', {
  tag: '@accessibility',
}, async ({ page, checkAccessibility }) => {
  const editDateOfBirthPage = new EditDateOfBirthPage(page);
  await editDateOfBirthPage.navigate();
  await checkAccessibility();
});
