import { test, expect } from '../fixtures/index.js';
import { setupAuth, assertCaseDetailsHeaderPresent, getClientDetailsUrlByStatus, logout } from '../utils/index.js';
import { AboutNewSplitCaseFormPage } from '../pages/AboutNewSplitCaseFormPage.js';

const clientDetailsUrl = getClientDetailsUrlByStatus('default');
const caseReference = clientDetailsUrl.split('/')[2]; // Extract case reference from URL

test.beforeEach(async ({ page }) => {
  await setupAuth(page);
});

test.afterEach(async ({ page }) => {
  await logout(page);
})

test('viewing "about new case" form should display expected elements', async ({ page, pages, i18nSetup }) => {
  const aboutNewCasePage = AboutNewSplitCaseFormPage.forCase(page, caseReference);

  // Navigate to the operator feedback form
  await aboutNewCasePage.navigate();

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(aboutNewCasePage.getPage, { withMenuButtons: false, isUrgent: true, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 July 2025" });

  // Assert the page heading is correct 
  const heading = aboutNewCasePage.getHeadingLocator();
  await expect(heading).toHaveText("About the new case");

  // Expect to see the original case category 
  await expect(aboutNewCasePage.originalCaseCategory).toHaveText("Original case category of law: Housing, eviction and homelessness");

  // Expect to see the new category of law header 
  await expect(aboutNewCasePage.newCategoryHeader).toHaveText("Category of law for new case");

  // Expect the select to be visible and enabled
  await expect(aboutNewCasePage.categorySelect).toBeVisible();

  await expect(aboutNewCasePage.categorySelect).toBeEnabled();

  // Expect the select to have the correct options (example with a few options, adjust as needed)
  await expect(aboutNewCasePage.categorySelect).toContainText('Select a category of law');
  await expect(aboutNewCasePage.categorySelect).toContainText('Housing, eviction and homelessness');
  await expect(aboutNewCasePage.categorySelect).toContainText('Debt, money problems and bankruptcy');

  //Expect the select to have the correct size
  const options = await aboutNewCasePage.categorySelect.locator('option').all();
  expect(options.length).toBe(3);
});

test('when there is only one category assigned to the provider and provider radio is selected this is displayed correctly', async ({ page, pages, i18nSetup }) => {
  const aboutNewCasePage = AboutNewSplitCaseFormPage.forCase(page, 'PC-1122-1349');

  // Navigate to the operator feedback form
  await aboutNewCasePage.navigate();

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(aboutNewCasePage.getPage, { withMenuButtons: false, isUrgent: true, expectedName: "Barbra white", expectedCaseRef: "PC-1122-1349", dateReceived: "7 July 2025" });

  // Assert the page heading is correct 
  const heading = aboutNewCasePage.getHeadingLocator();
  await expect(heading).toHaveText("About the new case");

  // Expect to see the original case category 
  await expect(aboutNewCasePage.originalCaseCategory).toHaveText("Original case category of law: Housing, eviction and homelessness");

  // Expect to see the new category of law header
  await expect(aboutNewCasePage.newCategoryHeader).toHaveText("Category of law for new case");

  // Expect the category to be displayed as text and not in a select
  expect(aboutNewCasePage.newCaseCategoryText)
    .toHaveText("New case category of law: Housing, eviction and homelessness");

});

test('shows operator category list', async ({ page }) => {
  const aboutNewCasePage = AboutNewSplitCaseFormPage.forCase(page, caseReference);

  // Go to the split-this-case form first
  await page.goto(`/cases/${caseReference}/split-this-case`);

  // Select the operator radio (internal = false)
  await page.check('input[name="internal"][value="false"]');

  // Submit the split case form to about new case
  await page.click('button[type="submit"]');

  // Assert we are on the about new case form
  await expect(page).toHaveURL(`/cases/${caseReference}/about-new-split-case`);

  // Expect operator categories (full list)
  await expect(aboutNewCasePage.categorySelect).toContainText('I don\'t know');

  //Expect the select to have the correct size (17 categories on the list, plus placeholder, plus "I don't know" option)
  const options = await aboutNewCasePage.categorySelect.locator('option').all();
  expect(options.length).toBe(18); 

});

test('selects a category and submits the about-new-split-case form', async ({ page }) => {
  const aboutNewCasePage = AboutNewSplitCaseFormPage.forCase(page, caseReference);

  await aboutNewCasePage.navigate();

  // Select a category from the <select>
  await page.selectOption('#category', { label: 'Debt, money problems and bankruptcy' });

  // Fill the notes field
  await page.fill('#notes', 'Splitting case because the issues differ');

  // Click the submit button
  await page.click('button.govuk-button');

  // Assert POST redirect happened
  await expect(page).toHaveURL(`/cases/${caseReference}/about-new-case`);
});

test('continue button should hit post about new case form end point', async ({ page, i18nSetup }) => {
  const aboutNewCasePage = AboutNewSplitCaseFormPage.forCase(page, caseReference);

  // Navigate to the operator feedback form
  await aboutNewCasePage.navigate();

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(aboutNewCasePage.getPage, { withMenuButtons: false, isUrgent: true, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 July 2025" });

  // Assert we are redirected to the about a new case page (or appropriate next page)
  await expect(page).toHaveURL(`/cases/${caseReference}/about-new-split-case`);
});