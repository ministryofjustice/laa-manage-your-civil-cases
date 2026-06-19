import { test, expect } from '../fixtures/index.js';
import { setupAuth, assertCaseDetailsHeaderPresent, assertSummaryCardData, assertSummaryCardState } from '../utils/index.js';

test.describe('Edit Client Name', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test('viewing change name form should display expected elements', async ({ pages }) => {
    const editNamePage = pages.editName;
    await editNamePage.navigate();
    // Assert the case details header is present
    await assertCaseDetailsHeaderPresent(editNamePage.getPage, { withMenuButtons: false, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 July 2025", badgeTexts: ['Urgent', 'At risk of abuse', 'Third Party'] });
    await expect(editNamePage.labelWrapper).toHaveText(editNamePage.getExpectedHeading());
  });

  test('cancel link should navigate back to client details', async ({ pages }) => {
    await pages.editName.expectCancelNavigatesBack();
    // Assert the case details header is present
    await assertCaseDetailsHeaderPresent(pages.editName.getPage, { withMenuButtons: true, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 July 2025", badgeTexts: ['Urgent', 'At risk of abuse', 'Third Party'] });
    // Assert support needs summary card is visible with no data 
    await assertSummaryCardState(pages.editName.getPage, { cardId: 'Client support needs', emptyText: 'No support needs', hasData: false, addHref: '/client-details/add/support-need' });
    // Assert third party details summary card is visible with data
    await assertSummaryCardState(pages.editName.getPage, { cardId: 'Third party contact', emptyText: 'No third party contact required', hasData: true, changeHref: '/client-details/change/third-party', removeHref: '/confirm/remove-third-party' });
    // Assert the correct data is displayed in the third party data summary card
    await assertSummaryCardData(pages.editName.getPage, 'Third party contact', { 'Name': 'Sarah Johnson', 'Phone number': 'Warning Not safe to call', 'Email address': 'sarah@johnson.com', 'Address': '45 Main Street, Sheffield S1 2AB', 'Relationship to client': 'Family member or friend' });
  });

  test('invalid data rejected by backend should not update client details', async ({ page, pages }) => {
    // This test verifies that when MSW rejects invalid data (400 response),
    // the client details are NOT updated, even though the app currently redirects
    const editNamePage = pages.editName;

    // First, get the original name from the client details page
    await page.goto('/cases/PC-1922-1879/client-details');
    // Assert the case details header is present
    await assertCaseDetailsHeaderPresent(editNamePage.getPage, { withMenuButtons: true, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 July 2025", badgeTexts: ['Urgent', 'At risk of abuse', 'Third Party'] });
    const originalName = await page.locator('.govuk-summary-list__value').first().textContent();

    // Assert support needs summary card is visible with no data 
    await assertSummaryCardState(pages.editName.getPage, { cardId: 'Client support needs', emptyText: 'No support needs', hasData: false, addHref: '/client-details/add/support-need' });
    // Assert third party details summary card is visible with data
    await assertSummaryCardState(pages.editName.getPage, { cardId: 'Third party contact', emptyText: 'No third party contact required', hasData: true, changeHref: '/client-details/change/third-party', removeHref: '/confirm/remove-third-party' });
    // Assert the correct data is displayed in the third party data summary card
    await assertSummaryCardData(pages.editName.getPage, 'Third party contact', { 'Name': 'Sarah Johnson', 'Phone number': 'Warning Not safe to call', 'Email address': 'sarah@johnson.com', 'Address': '45 Main Street, Sheffield S1 2AB', 'Relationship to client': 'Family member or friend' });

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


  test.describe('PC-1854-6521 scenario', () => {
    test.use({ caseId: 'PC-1854-6521' });

    test('save button should redirect to client details when valid data submitted', async ({ pages }) => {
      const editNamePage = pages.editName;
      await editNamePage.navigate();
      // Assert the case details header is present
      await assertCaseDetailsHeaderPresent(editNamePage.getPage, { withMenuButtons: false, expectedName: "Walter White", expectedCaseRef: "PC-1854-6521", dateReceived: "8 August 2025", badgeTexts: ['At risk of abuse'] });

      await editNamePage.submitWithValidName('John Updated Smith');
      await editNamePage.expectSuccessfulSubmission();
      // Assert the case details header is present
      await assertCaseDetailsHeaderPresent(editNamePage.getPage, { withMenuButtons: false, expectedName: "John Updated Smith", expectedCaseRef: "PC-1854-6521", dateReceived: "8 August 2025", badgeTexts: ['At risk of abuse'] });
      expect(editNamePage.expectNoWarningBanner())
       // Assert support needs summary card is visible with no data 
      await assertSummaryCardState(editNamePage.getPage, { cardId: 'Client support needs', emptyText: 'No support needs', hasData: false, addHref: '/client-details/add/support-need' });
      // Assert third party details summary card is visible with data
      await assertSummaryCardState(editNamePage.getPage, { cardId: 'Third party contact', emptyText: 'No third party contact required', hasData: false, addHref: '/client-details/add/third-party' });
  });
  });
  test('name form displays validation errors correctly', async ({ pages }) => {
    const editNamePage = pages.editName;
    await editNamePage.submitWithEmptyName();
    await editNamePage.expectErrorSummaryVisible();

    // Check individual field error appears
    await expect(editNamePage.nameError).toBeVisible();
    await expect(editNamePage.alertBanner).not.toBeVisible();
  });

  test('name form does not display alert banner for validation errors', async ({ pages }) => {
    const editNamePage = pages.editName;
    await editNamePage.submitWithEmptyName();
    await editNamePage.expectErrorSummaryVisible();

    // Check alert banner is not present (as this is a validation error takes priority)
    await expect(editNamePage.alertBanner).not.toBeVisible();
  });

  test('unchanged name triggers no change warning banner', async ({ pages }) => {
    const editNamePage = pages.editName;
    await editNamePage.submitWithoutChanges();
    await editNamePage.expectSuccessfulSubmission();
    await editNamePage.expectNoChangeWarningBanner('No changes were made');
     // Assert support needs summary card is visible with no data 
    await assertSummaryCardState(pages.editName.getPage, { cardId: 'Client support needs', emptyText: 'No support needs', hasData: false, addHref: '/client-details/add/support-need' });
    // Assert third party details summary card is visible with data
    await assertSummaryCardState(pages.editName.getPage, { cardId: 'Third party contact', emptyText: 'No third party contact required', hasData: true, changeHref: '/client-details/change/third-party', removeHref: '/confirm/remove-third-party' });
    // Assert the correct data is displayed in the third party data summary card
    await assertSummaryCardData(pages.editName.getPage, 'Third party contact', { 'Name': 'Sarah Johnson', 'Phone number': 'Warning Not safe to call', 'Email address': 'sarah@johnson.com', 'Address': '45 Main Street, Sheffield S1 2AB', 'Relationship to client': 'Family member or friend' });
});

  test('name edit page should be accessible', {
    tag: '@accessibility',
  }, async ({ pages, checkAccessibility }) => {
    await pages.editName.navigate();
    await checkAccessibility();
  });
});