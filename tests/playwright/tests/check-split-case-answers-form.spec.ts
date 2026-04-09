import { test, expect } from '../fixtures/index.js';
import { setupAuth, assertCaseDetailsHeaderPresent, getClientDetailsUrlByStatus, logout } from '../utils/index.js';
import { CheckSplitCaseAnswersPage } from '../pages/CheckSplitCaseAnswersFormPage.js';
import { SplitThisCaseFormPage } from '../pages/SplitCaseFormPage.js';
import { AboutNewSplitCaseFormPage } from '../pages/AboutNewSplitCaseFormPage.js';

const clientDetailsUrl = getClientDetailsUrlByStatus('default');
const caseReference = clientDetailsUrl.split('/')[2]; // Extract case reference from URL

test.beforeEach(async ({ page }) => {
  await setupAuth(page);
});

test.afterEach(async ({ page }) => {
  await logout(page);
})

test('viewing "check split case answers" form should display expected elements', async ({ page }) => {
  const checkSplitCaseAnswersPage = CheckSplitCaseAnswersPage.forCase(page, caseReference);

  // Navigate directly to the check split case answers form
  await checkSplitCaseAnswersPage.navigate();

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(checkSplitCaseAnswersPage.getPage, { withMenuButtons: false, isUrgent: true, expectedName: 'Jack Youngs', expectedCaseRef: 'PC-1922-1879', dateReceived: '7 July 2025', });

  // Assert the page heading is correct
  const heading = checkSplitCaseAnswersPage.getHeadingLocator();
  await expect(heading).toHaveText('Check your answers');

  // Expect both summary card headings
  await expect(checkSplitCaseAnswersPage.originalCaseHeader).toBeVisible();
  await expect(checkSplitCaseAnswersPage.originalCaseHeader).toHaveText('Original case');

  await expect(checkSplitCaseAnswersPage.newCaseHeader).toBeVisible();
  await expect(checkSplitCaseAnswersPage.newCaseHeader).toHaveText('New case');

  // Expect key labels to be visible
  await expect(checkSplitCaseAnswersPage.categoryOfLawLabel.first()).toBeVisible();
  await expect(checkSplitCaseAnswersPage.assignedToLabel.first()).toBeVisible();
  await expect(checkSplitCaseAnswersPage.whySplitCaseLabel).toBeVisible();

  // Expect actions to be visible
  await expect(checkSplitCaseAnswersPage.changeLink).toBeVisible();
  await expect(checkSplitCaseAnswersPage.confirmSplitButton).toBeVisible();
  await expect(checkSplitCaseAnswersPage.cancelLink).toBeVisible();
});

test('change link should navigate back to the about new case form', async ({ page }) => {
  // Navigate
  const checkSplitCaseAnswersPage = CheckSplitCaseAnswersPage.forCase(page, caseReference);
  await checkSplitCaseAnswersPage.navigate();

  // Assert
  await expect(checkSplitCaseAnswersPage.changeLink).toBeVisible();
  await checkSplitCaseAnswersPage.changeLink.click();

  // Expect
  await expect(page).toHaveURL(`/cases/${caseReference}/split-this-case`);
});

test('cancel link should navigate back to client details', async ({ page }) => {
  // Navigate
  const checkSplitCaseAnswersPage = CheckSplitCaseAnswersPage.forCase(page, caseReference);
  await checkSplitCaseAnswersPage.navigate();

  // Assert
  await expect(checkSplitCaseAnswersPage.cancelLink).toBeVisible();
  await checkSplitCaseAnswersPage.cancelLink.click();

  // Expect
  await expect(page).toHaveURL(`/cases/${caseReference}/client-details`);

});

test('cancel link after clicking change link should navigate back to the check your answers form', async ({ page }) => {
  // Navigate
  const checkSplitCaseAnswersPage = CheckSplitCaseAnswersPage.forCase(page, caseReference);
  await checkSplitCaseAnswersPage.navigate();

  // Assert
  await expect(checkSplitCaseAnswersPage.changeLink).toBeVisible();
  await checkSplitCaseAnswersPage.changeLink.click();

  // We should now be on the split-this-case page
  const splitThisCaseFormPage = SplitThisCaseFormPage.forCase(page, caseReference);
  await expect(page).toHaveURL(splitThisCaseFormPage.url);

  // Assert: Cancel link should navigate back to check-your-answers
  await expect(splitThisCaseFormPage.cancelLink).toBeVisible();
  await splitThisCaseFormPage.cancelLink.click();

  // Final expected page
  await expect(page).toHaveURL(checkSplitCaseAnswersPage.url);

});

test('cancel link after clicking change link should navigate back to the check your answers form from about new case page', async ({ page }) => {
  // Navigate
  const checkSplitCaseAnswersPage = CheckSplitCaseAnswersPage.forCase(page, caseReference);
  await checkSplitCaseAnswersPage.navigate();

  // Assert
  await expect(checkSplitCaseAnswersPage.changeLink).toBeVisible();
  await checkSplitCaseAnswersPage.changeLink.click();

  // We should now be on the split-this-case page
  const splitThisCaseFormPage = SplitThisCaseFormPage.forCase(page, caseReference);
  await expect(page).toHaveURL(splitThisCaseFormPage.url);

  // Select the "Generic Provider Public Law" radio option
  const radioInternalTrue = page.getByRole('radio', { name: 'Generic Provider Public Law' });
  await radioInternalTrue.check();

  // Click the continue button
  const continueButton = page.getByRole('button', { name: 'Continue' });
  await continueButton.click();

  const aboutNewCasePage = AboutNewSplitCaseFormPage.forCase(page, caseReference);
  await expect(page).toHaveURL(aboutNewCasePage.url);

  await aboutNewCasePage.cancelLink.click();
  // Final expected page
  await expect(page).toHaveURL(checkSplitCaseAnswersPage.url);

});

test('if the same provider radio button is selected the about new case details should have data populated', async ({ page }) => {
  // Set up test so we have completed one pass through the flow. 
  const initialSplitThisCaseFormPage = SplitThisCaseFormPage.forCase(page, caseReference);
  await initialSplitThisCaseFormPage.navigate();
  await expect(page).toHaveURL(initialSplitThisCaseFormPage.url);

  // Select the "Generic Provider Public Law" radio option
  const initialRadioInternalTrue = page.getByRole('radio', { name: 'Generic Provider Public Law' });
  await initialRadioInternalTrue.check();

  // Click the continue button
  const initialContinueButton = page.getByRole('button', { name: 'Continue' });
  await initialContinueButton.click();

  const initialAboutNewCasePage = AboutNewSplitCaseFormPage.forCase(page, caseReference);
  await expect(page).toHaveURL(initialAboutNewCasePage.url);

  await page.selectOption('#category', { label: 'Debt, money problems and bankruptcy' });

  // Fill the notes field
  await page.fill('#notes', 'Splitting case because the issues differ');

  // Click the submit button to the check your answers page
  await page.click('button.govuk-button');

  // Navigate to check your answers
  const checkSplitCaseAnswersPage = CheckSplitCaseAnswersPage.forCase(page, caseReference);

  // Check the change link is available and click it.
  await expect(checkSplitCaseAnswersPage.changeLink).toBeVisible();
  await checkSplitCaseAnswersPage.changeLink.click();

  // We should now be on the split-this-case page for the second time. 
  const splitThisCaseFormPage = SplitThisCaseFormPage.forCase(page, caseReference);
  await expect(page).toHaveURL(splitThisCaseFormPage.url);

  // Select the "Generic Provider Public Law" radio option

  await expect(page.getByRole('radio', { name: 'Generic Provider Public Law' }))
    .toBeChecked();

  // Click the continue button
  const continueButton = page.getByRole('button', { name: 'Continue' });
  await continueButton.click();

  // Arrive at the new case details page 
  const aboutNewCasePage = AboutNewSplitCaseFormPage.forCase(page, caseReference);
  await expect(page).toHaveURL(aboutNewCasePage.url);

  const categorySelection = aboutNewCasePage.newCaseCategoryText;
  await expect(aboutNewCasePage.categorySelect).toHaveValue("debt");
  await aboutNewCasePage.cancelLink.click();
  // Final expected page
  await expect(page).toHaveURL(checkSplitCaseAnswersPage.url);

});

test('confirm split button should submit the form', async ({ page }) => {
  // Navigate by starting from the about new split case page (can't submit without actual values)
  const checkSplitCaseAnswersPage = CheckSplitCaseAnswersPage.forCase(page, caseReference);
  await page.goto(`/cases/${caseReference}/about-new-case`);

  // Assert by filling out the form
  await page.selectOption('#category', { label: 'Debt, money problems and bankruptcy' });
  await page.fill('#notes', 'Splitting case because the issues differ');

  // Assert by submitting the form
  await page.click('button.govuk-button');

  // Expect
  await expect(page).toHaveURL(checkSplitCaseAnswersPage.url);
  await expect(checkSplitCaseAnswersPage.confirmSplitButton).toBeVisible();
  await checkSplitCaseAnswersPage.confirmSplitButton.click();
  await expect(page).toHaveURL(`/cases/${caseReference}/client-details`);
});

test('confirm correct `operatorReassignment` text shown when selecting `operatorReassignment` radio button', async ({ page }) => {
  // Navigate by starting from the about split case page 
  const checkSplitCaseAnswersPage = CheckSplitCaseAnswersPage.forCase(page, caseReference);
  await page.goto(`/cases/${caseReference}/split-this-case`);

  // Navigate & Assert by selecting 2nd radio button on the form and submitting 
  const radioInternalFalse = page.getByRole('radio', { name: 'To operator for reassignment' });
  await expect(radioInternalFalse).toBeVisible();
  await radioInternalFalse.check();
  await page.click('button.govuk-button');

  // Navigate & Assert by filling out the about new split case page, then submitting
  await page.selectOption('#category', { label: 'Debt, money problems and bankruptcy' });
  await page.fill('#notes', 'Splitting case because the issues differ');
  await page.click('button.govuk-button');

  // Expect text to be on page
  await expect(page).toHaveURL(checkSplitCaseAnswersPage.url);
  await expect(page.getByText('To operator for reassignment')).toBeVisible();
});

test('check split case answers page should display change, confirm and cancel controls', async ({ page }) => {
  // Navigate
  const checkSplitCaseAnswersPage = CheckSplitCaseAnswersPage.forCase(page, caseReference);
  await checkSplitCaseAnswersPage.navigate();

  // Expect
  await expect(checkSplitCaseAnswersPage.changeLink).toHaveText('Change Change new case details (New case)'); // This includes visuallyHiddenText, to help with accessibility  
  await expect(checkSplitCaseAnswersPage.confirmSplitButton).toBeEnabled();
  await expect(checkSplitCaseAnswersPage.cancelLink).toHaveText('Cancel');
});