import { test, expect } from '../fixtures/index.js';
import { setupAuth } from '../utils/index.js';

test.describe('Edit Client Name', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test('viewing change name form should display expected elements', async ({ pages, i18nSetup }) => {
    const editNamePage = pages.editName;
    await editNamePage.navigate();
    await editNamePage.expectPageLoaded(editNamePage.getExpectedHeading());
  });

  test('cancel link should navigate back to client details', async ({ pages, i18nSetup }) => {
    await pages.editName.expectCancelNavigatesBack();
  });

  test('save button should redirect to client details when valid data submitted', async ({ pages, i18nSetup }) => {
    const editNamePage = pages.editName;
    await editNamePage.submitWithValidName('John Updated Smith');
    await editNamePage.expectSuccessfulSubmission();
  });

  test('invalid data rejected by backend should not update client details', async ({ page, pages, i18nSetup }) => {
    // This test verifies that when MSW rejects invalid data (400 response),
    // the client details are NOT updated, even though the app currently redirects
    const editNamePage = pages.editName;
    
    // First, get the original name from the client details page
    await page.goto('/cases/PC-1922-1879/client-details');
    const originalName = await page.locator('.govuk-summary-list__value').first().textContent();
    
    // Navigate to edit name page
    await editNamePage.navigate();
    
    // Try to submit a name that's too long (> 400 characters)
    // MSW will reject this with a 400 error
    const tooLongName = 'A'.repeat(401);
    await editNamePage.fillName(tooLongName);
    await editNamePage.clickSave();
    
    // The app currently redirects despite the error (not ideal, but current behavior)
    await page.waitForURL(/client-details/, { timeout: 5000 });
    
    // Verify the name was NOT updated - should still show original name
    const currentName = await page.locator('.govuk-summary-list__value').first().textContent();
    expect(currentName).toBe(originalName);
    expect(currentName).not.toContain('AAAA'); // Should not contain the rejected long name
  });

  test('name form displays validation errors correctly', async ({ pages, i18nSetup }) => {
    const editNamePage = pages.editName;
    await editNamePage.submitWithEmptyName();
    await editNamePage.expectErrorSummaryVisible();
    
    // Check individual field error appears
    await expect(editNamePage.nameError).toBeVisible();
  });

  test('unchanged name triggers change detection error', async ({ pages, i18nSetup }) => {
    const editNamePage = pages.editName;
    await editNamePage.submitWithoutChanges();
    await editNamePage.expectErrorSummaryVisible();
    
    // Check that the error summary contains the expected change detection message
    const errorSummary = editNamePage.errorSummary;
    await expect(errorSummary).toContainText("Change the client name");
  });

  test('name edit page should be accessible', {
    tag: '@accessibility',
  }, async ({ pages, checkAccessibility }) => {
    await pages.editName.navigate();
    await checkAccessibility();
  });
});