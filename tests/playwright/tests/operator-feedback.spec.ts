import { test, expect } from '../fixtures/index.js';
import { getClientDetailsUrlByStatus, setupAuth, assertCaseDetailsHeaderPresent } from '../utils/index.js';
import { OperatorFeedbackFormPage } from '../pages/OperatorFeedbackFormPage.js';

const clientDetailsUrl = getClientDetailsUrlByStatus('default');
const caseReference = clientDetailsUrl.split('/')[2]; // Extract case reference from URL

test.beforeEach(async ({ page }) => {
  await setupAuth(page);
});

test('viewing operator feedback form should display expected elements', async ({ page, i18nSetup }) => {
  const feedbackPage = OperatorFeedbackFormPage.forCase(page, caseReference);

  // Navigate to the operator feedback form
  await feedbackPage.navigate();

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(feedbackPage.getPage, false, "Jack Youngs", "PC-1922-1879", "7 Jul 2025");

  // Expect to see the main elements
  await expect(feedbackPage.headingH1Fieldset).toHaveText(feedbackPage.getExpectedHeading());
  await feedbackPage.expectFormElementsVisible();
});

test('cancel link should navigate back to client details', async ({ page, i18nSetup }) => {
  const feedbackPage = OperatorFeedbackFormPage.forCase(page, caseReference);

  // Test cancel navigation using base class method
  await feedbackPage.expectCancelNavigatesBack();

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(feedbackPage.getPage, true, "Jack Youngs", "PC-1922-1879", "7 Jul 2025");
});

test('save button should redirect to client details when valid data submitted', async ({ page, i18nSetup }) => {
  const feedbackPage = OperatorFeedbackFormPage.forCase(page, caseReference);

  // Navigate to the operator feedback form
  await feedbackPage.navigate();

  // Submit feedback with valid data
  await feedbackPage.submitWithData('ADCO', 'This is a test operator feedback comment');

  // Should redirect to client details page
  await feedbackPage.expectSuccessfulSubmission();
});

test('operator feedback form displays validation errors correctly', async ({ page, i18nSetup }) => {
  const feedbackPage = OperatorFeedbackFormPage.forCase(page, caseReference);

  // Navigate to the operator feedback form
  await feedbackPage.navigate();

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(feedbackPage.getPage, false, "Jack Youngs", "PC-1922-1879", "7 Jul 2025");

  // Submit form without selecting category or entering comment
  await feedbackPage.clickSave();

  // Check GOV.UK error summary appears
  await feedbackPage.expectErrorSummaryVisible();

  // Check individual field errors appear
  await feedbackPage.expectCategoryFieldError();
  await feedbackPage.expectCommentFieldError();
});

test('operator feedback form validates category is required', async ({ page, i18nSetup }) => {
  const feedbackPage = OperatorFeedbackFormPage.forCase(page, caseReference);

  // Navigate to the operator feedback form
  await feedbackPage.navigate();

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(feedbackPage.getPage, false, "Jack Youngs", "PC-1922-1879", "7 Jul 2025");

  // Submit form with comment but no category
  await feedbackPage.fillComment('This is a comment without category');
  await feedbackPage.clickSave();

  // Check GOV.UK error summary appears
  await feedbackPage.expectErrorSummaryVisible();

  // Check category field error appears
  await feedbackPage.expectCategoryFieldError();
});

test('operator feedback form validates comment is required', async ({ page, i18nSetup }) => {
  const feedbackPage = OperatorFeedbackFormPage.forCase(page, caseReference);

  // Navigate to the operator feedback form
  await feedbackPage.navigate();

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(feedbackPage.getPage, false, "Jack Youngs", "PC-1922-1879", "7 Jul 2025");

  // Submit form with category but no comment
  await feedbackPage.selectCategory('ADCO');
  await feedbackPage.clickSave();

  // Check GOV.UK error summary appears
  await feedbackPage.expectErrorSummaryVisible();

  // Check comment field error appears
  await feedbackPage.expectCommentFieldError();
});

test('operator feedback form validates comment length', async ({ page, i18nSetup }) => {
  const feedbackPage = OperatorFeedbackFormPage.forCase(page, caseReference);

  // Navigate to the operator feedback form
  await feedbackPage.navigate();

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(feedbackPage.getPage, false, "Jack Youngs", "PC-1922-1879", "7 Jul 2025");

  // Submit form with comment exceeding 2500 characters
  const longComment = 'a'.repeat(2501);
  await feedbackPage.selectCategory('ADCO');
  await feedbackPage.fillComment(longComment);
  await feedbackPage.clickSave();

  // Check GOV.UK error summary appears
  await feedbackPage.expectErrorSummaryVisible();

  // Check comment field error appears
  await feedbackPage.expectCommentFieldError();
});

test('character count component displays remaining characters', async ({ page, i18nSetup }) => {
  const feedbackPage = OperatorFeedbackFormPage.forCase(page, caseReference);

  // Navigate to the operator feedback form
  await feedbackPage.navigate();

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(feedbackPage.getPage, false, "Jack Youngs", "PC-1922-1879", "7 Jul 2025");

  // Type enough text to pass the 85% threshold so the character count message appears
  // Threshold triggers at 2126 chars (85% of 2500), typing 2125 leaves 375 characters remaining
  const comment = 'a'.repeat(2125);
  await feedbackPage.fillComment(comment);

  // Wait for the character count status to update and show the remaining count
  const characterCountStatus = page.locator('.govuk-character-count__status');
  await expect(characterCountStatus).toContainText('You have 375 characters remaining');
});
