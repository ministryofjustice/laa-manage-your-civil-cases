import { test, expect } from '../fixtures/index.js';
import { setupAuth, assertCaseDetailsHeaderPresent, assertSummaryCardState, assertSummaryCardData } from '../utils/index.js';
import { ClientDetailsPage, PendingCaseFormPage, CloseCaseFormPage, ReopenCaseFormPage, GiveFeedbackFormPage } from '../pages/index.js';

test.describe('Case Status Handling', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test.describe('Accept Case', () => {
    test('should show case status', async ({ page }) => {
      const clientDetails = ClientDetailsPage.forCase(page, 'PC-1922-1879');
      await clientDetails.navigate();

      // Assert the case details header is present
      await assertCaseDetailsHeaderPresent(page, { withMenuButtons: true, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 July 2025", badgeTexts: ['Urgent', 'At risk of abuse', 'Third Party'] });

      await clientDetails.expectStatus('New');
      await expect(page).toHaveURL(clientDetails.url);

      // Assert support needs summary card is visible with no data 
      await assertSummaryCardState(page, { cardId: 'Client support needs', emptyText: 'No support needs', hasData: false, addHref: '/client-details/add/support-need' });
      // Assert third party details summary card is visible with data
      await assertSummaryCardState(page, { cardId: 'Third party contact', emptyText: 'No third party contact required', hasData: true, changeHref: '/client-details/change/third-party', removeHref: '/confirm/remove-third-party' });
      // Assert the correct data is displayed in the third party data summary card
      await assertSummaryCardData(page, 'Third party contact', { 'Name': 'Sarah Johnson', 'Phone number': 'Warning Not safe to call', 'Email address': 'sarah@johnson.com', 'Address': '45 Main Street, Sheffield S1 2AB', 'Relationship to client': 'Family member or friend' });
    });

    test('accepted case should be accessible', {
      tag: '@accessibility',
    }, async ({ page, checkAccessibility }) => {
      const clientDetails = ClientDetailsPage.forCase(page, 'PC-1922-1879');
      await clientDetails.navigate();
      await checkAccessibility();
    });

    test('should be able to click Advising and hit endpoint', async ({ page }) => {
      const clientDetails = ClientDetailsPage.forCase(page, 'PC-1922-1866');

      await clientDetails.navigate();
      // Assert the case details header is present
      await assertCaseDetailsHeaderPresent(page, { withMenuButtons: true, expectedName: "Katie Young", expectedCaseRef: "PC-1922-1866", dateReceived: "7 July 2025", badgeTexts: ['At risk of abuse', 'Third Party', 'Translation', 'Text relay'] });

      // Assert support needs summary card is visible with data 
      await assertSummaryCardState(page, { cardId: 'Client support needs', emptyText: 'No support needs', hasData: true, changeHref: '/client-details/change/support-need' });
      // Assert the data in the support needs summary card is correct
      await assertSummaryCardData(page, 'Client support needs', { 'Relay UK': 'Yes', 'Callback preference': 'Yes', 'Language – needs interpreter': 'German', 'Other support': 'Client requires German language support' });
      // Assert third party details summary card is visible with data
      await assertSummaryCardState(page, { cardId: 'Third party contact', emptyText: 'No third party contact required', hasData: true, changeHref: '/client-details/change/third-party', removeHref: '/confirm/remove-third-party' });
      // Assert the data in the third party summary card is correct
      await assertSummaryCardData(page, 'Third party contact', { 'Name': 'Sarah Johnson', 'Phone number': '0787123456', 'Email address': 'sarah@johnson.com', 'Address': '45 Main Street, Sheffield S1 2AB', 'Relationship to client': 'Family member or friend', 'Passphrase': 'TestPass123' });

      await clientDetails.expectStatus('New');

      // Click `Change status` button
      const toggle = page.getByRole('button', { name: 'Change status' });
      await expect(toggle).toBeVisible();
      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');

      // Click advising and send a post request. 
      const advisingButton = page.getByRole('button', { name: 'Advising' })
      await advisingButton.click();

      await expect(page).toHaveURL(clientDetails.url);
      await expect(page.locator('.govuk-tag--blue')).toHaveText('Advising');
    });

    test('Move a closed case to advising', async ({ page }) => {
      const clientDetails = ClientDetailsPage.forCase(page, 'PC-4532-2312');

      await clientDetails.navigate();
      // Assert the case details header is present
      await assertCaseDetailsHeaderPresent(page, { withMenuButtons: true, expectedName: "Zechariah Twelve", expectedCaseRef: "PC-4532-2312", dateReceived: "6 January 2025", badgeTexts: ['At risk of abuse', 'Third Party'] });

      // Assert support needs summary card is visible with no data 
      await assertSummaryCardState(page, { cardId: 'Client support needs', emptyText: 'No support needs', hasData: false, addHref: '/client-details/add/support-need'});
      // Assert third party details summary card is visible with data
      await assertSummaryCardState(page, { cardId: 'Third party contact', emptyText: 'No third party contact required', hasData: true, changeHref: '/client-details/change/third-party', removeHref: '/confirm/remove-third-party' });
      // Assert the data in the third party summary card is correct
      await assertSummaryCardData(page, 'Third party contact', { 'Name': 'Alex Rivers', 'Phone number': 'Not provided', 'Email address': 'alex@rivers.com', 'Address': '22 Baker Street, London NW1 6XE', 'Relationship to client': 'Legal adviser', 'Passphrase': 'LetMeIn' });

      await clientDetails.expectStatus('Closed');

      // Click `Change status` button
      const toggle = page.getByRole('button', { name: 'Change status' });
      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');

      // Click advising and send a post request. 
      const advisingButton = page.getByRole('button', { name: 'Advising' })
      await advisingButton.click();

      // Add note and save. 
      await expect(page).toHaveURL(`/cases/PC-4532-2312/why-reopen-closed-case`);
      const adviseNote = page.locator('textarea[name="reopenNote"]');
      await adviseNote.fill("Needs more advise")
      const save = page.getByRole('button', { name: 'Save' });
      await save.click();

      await expect(page.locator('.govuk-tag--blue')).toHaveText('Advising');
    });
  });

  test.describe('Mark Case as Pending', () => {
    test('should display pending form correctly', async ({ page }) => {
      const pendingPage = PendingCaseFormPage.forCase(page, 'PC-1922-1879');
      await pendingPage.navigate();
      // Assert the case details header is present
      await assertCaseDetailsHeaderPresent(page, { withMenuButtons: false, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 July 2025", badgeTexts: ['Urgent', 'At risk of abuse', 'Third Party'] });
      await pendingPage.expectFormLoaded();
      await pendingPage.expectReasonOptionVisible('Third party authorisation');
      await expect(pendingPage.saveButton).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
      const pendingPage = PendingCaseFormPage.forCase(page, 'PC-1922-1879');
      await pendingPage.navigate();
      // Assert the case details header is present
      await assertCaseDetailsHeaderPresent(page, { withMenuButtons: false, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 July 2025", badgeTexts: ['Urgent', 'At risk of abuse', 'Third Party'] });
      await pendingPage.clickSave();
      await pendingPage.expectErrorSummaryVisible();
    });

    test('why-pending form should be accessible', {
      tag: '@accessibility',
    }, async ({ page, checkAccessibility }) => {
      const pendingPage = PendingCaseFormPage.forCase(page, 'PC-1922-1879');
      await pendingPage.navigate();
      await checkAccessibility();
    });
  });

  test.describe('Close Case', () => {
    test('should submit close case form', async ({ page }) => {
      const closePage = CloseCaseFormPage.forCase(page, 'PC-9159-2337');
      await closePage.navigate();
      // Assert the case details header is present
      await assertCaseDetailsHeaderPresent(page, { withMenuButtons: false, expectedName: "George Allen", expectedCaseRef: "PC-9159-2337", dateReceived: "9 January 2025", badgeTexts: ['At risk of abuse', 'Third Party'] });
      await closePage.submitWithData('MIS-MEANS', 'Case successfully closed');

      const giveFeedback = GiveFeedbackFormPage.forCase(page, 'PC-9159-2337');
      await expect(page).toHaveURL(giveFeedback.url);
      await giveFeedback.expectStatus('Closed');
    });

    test('should submit close case form, using MERI code', async ({ page }) => {
      const closePage = CloseCaseFormPage.forCase(page, 'PC-7755-4557');
      await closePage.navigate();
      // Assert the case details header is present
      await assertCaseDetailsHeaderPresent(page, { withMenuButtons: false, expectedName: "Alan Turning", expectedCaseRef: "PC-7755-4557", dateReceived: "9 January 2025", badgeTexts: ['At risk of abuse', 'Third Party'] });
      await closePage.submitWithData('MERI', 'Case successfully closed as Merits - not eligible"');

      const giveFeedback = GiveFeedbackFormPage.forCase(page, 'PC-7755-4557');
      await expect(page).toHaveURL(giveFeedback.url);
      await giveFeedback.expectStatus('Closed');
    });

    test('should validate required fields', async ({ page }) => {
      const closePage = CloseCaseFormPage.forCase(page, 'PC-2211-4466');
      await closePage.navigate();
      // Assert the case details header is present
      await assertCaseDetailsHeaderPresent(page, { withMenuButtons: false, expectedName: "Vinsmoke Sanji", expectedCaseRef: "PC-2211-4466", dateReceived: "8 August 2025", badgeTexts: ['At risk of abuse', 'Third Party', 'Translation', 'Text relay', 'BSL'] });
      await closePage.clickSave();

      await closePage.expectErrorSummaryVisible();
    });

    test('why-closed form should be accessible', {
      tag: '@accessibility',
    }, async ({ page, checkAccessibility }) => {
      const closePage = CloseCaseFormPage.forCase(page, 'PC-3184-5962');
      await closePage.navigate();
      await checkAccessibility();
    });
  });

  test.describe('Complete Case', () => {
    test('should be able to click Completed and hit endpoint', async ({ page }) => {
      const clientDetails = ClientDetailsPage.forCase(page, 'PC-3184-5962');

      await clientDetails.navigate();
      // Assert the case details header is present
      await assertCaseDetailsHeaderPresent(page, { withMenuButtons: true, expectedName: "Ember Hamilton", expectedCaseRef: "PC-3184-5962", dateReceived: "9 January 2025", badgeTexts: ['At risk of abuse', 'Third Party'] });

      // Assert support needs summary card is visible with no data 
      await assertSummaryCardState(page, { cardId: 'Client support needs', emptyText: 'No support needs', hasData: false, addHref: '/client-details/add/support-need' });
      // Assert third party details summary card is visible with data
      await assertSummaryCardState(page, { cardId: 'Third party contact', emptyText: 'No third party contact required', hasData: true, changeHref: '/client-details/change/third-party', removeHref: '/confirm/remove-third-party' });
      // Assert the data in the summary card is correct
      await assertSummaryCardData(page, 'Third party contact', { 'Name': 'Chris Green', 'Phone number': '0786304271', 'Email address': 'chris@green.com', 'Address': '22 Baker Street, London NW1 6XE', 'Relationship to client': 'Other' });

      await clientDetails.expectStatus('Advising');

      // Click `Change status` button
      const toggle = page.getByRole('button', { name: 'Change status' });
      await expect(toggle).toBeVisible();
      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');

      // Click completed and send a post request. 
      const completedButton = page.getByRole('button', { name: 'Completed' })
      await completedButton.click();

      await expect(page).toHaveURL(clientDetails.url);
      await expect(page.locator('.govuk-tag--pink')).toHaveText('Completed');
    });

  });

  test.describe('Reopen Case', () => {
    test('should submit reopen case form', async ({ page }) => {
      const reopenPage = ReopenCaseFormPage.forCase(page, 'PC-1122-3344');
      await reopenPage.navigate();
      // Assert the case details header is present
      await assertCaseDetailsHeaderPresent(page, { withMenuButtons: false, expectedName: "Red Haired Shanks", expectedCaseRef: "PC-1122-3344", dateReceived: "8 August 2025", badgeTexts: ['At risk of abuse', 'Third Party', 'Translation', 'BSL'] });
      await reopenPage.submitWithNote('Client requested case to be reopened');

      const clientDetails = ClientDetailsPage.forCase(page, 'PC-1122-3344');
      await expect(page).toHaveURL(clientDetails.url);
    });

    test('why-reopen-completed-case form should be accessible', {
      tag: '@accessibility',
    }, async ({ page, checkAccessibility }) => {
      const reopenPage = ReopenCaseFormPage.forCase(page, 'PC-1122-3344');
      await reopenPage.navigate();
      await checkAccessibility();
    });
  });
});