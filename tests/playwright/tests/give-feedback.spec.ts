import { test, expect } from '../fixtures/index.js';
import { getClientDetailsUrlByStatus, setupAuth, assertCaseDetailsHeaderPresent } from '../utils/index.js';
import { GiveFeedbackFormPage } from '../pages/GiveFeedbackFormPage.js';

const clientDetailsUrl = getClientDetailsUrlByStatus('closed');
const caseReference = clientDetailsUrl.split('/')[2]; // Extract case reference from URL

test.beforeEach(async ({ page }) => {
  await setupAuth(page);
});

test('viewing "do you want to give feedback" form should display expected elements', async ({ page, i18nSetup }) => {
  const feedbackPage = GiveFeedbackFormPage.forCase(page, caseReference);

  // Navigate to the operator feedback form
  await feedbackPage.navigate();

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(feedbackPage.getPage, { withMenuButtons: false, expectedName: "Roronoa Zoro", expectedCaseRef: "PC-6667-9089", dateReceived: "6 Jan 2025" }); 

  // Expect to see the main elements
  await feedbackPage.getExpectedHeading();
  await feedbackPage.expectFormElementsVisible();
});

test('continue button should redirect to `give-operator-feedback` URL when radio selected', async ({ page, i18nSetup }) => {
  const feedbackPage = GiveFeedbackFormPage.forCase(page, caseReference);

  // Navigate to the operator feedback form
  await feedbackPage.navigate();

  // Submit feedback with valid data
  await feedbackPage.submitWithData('true');

  // Should redirect to client details page
  await feedbackPage.expectSuccessfulSubmission();
});

test('"do you want to give feedback" form displays validation errors correctly', async ({ page, i18nSetup }) => {
  const feedbackPage = GiveFeedbackFormPage.forCase(page, caseReference);

  // Navigate to the operator feedback form
  await feedbackPage.navigate();

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(feedbackPage.getPage, { withMenuButtons: false, expectedName: "Roronoa Zoro", expectedCaseRef: "PC-6667-9089", dateReceived: "6 Jan 2025" });  

  // Submit form without selecting category or entering comment
  await feedbackPage.clickContinue();

  // Check GOV.UK error summary appears
  await feedbackPage.expectErrorSummaryVisible();

  // Error summary messages
  const errorSummaryLinkText = page.getByRole('alert').getByRole('link', { name: 'Select yes if you want to give feedback about the operator service' });
  await expect(errorSummaryLinkText).toBeVisible();
});