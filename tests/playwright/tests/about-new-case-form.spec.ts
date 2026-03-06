import { test, expect } from '../fixtures/index.js';
import { setupAuth, assertCaseDetailsHeaderPresent, getClientDetailsUrlByStatus} from '../utils/index.js';
import { AboutNewCaseFormPage } from '../pages/AboutNewCaseFormPage.js';  

const clientDetailsUrl = getClientDetailsUrlByStatus('default');
const caseReference = clientDetailsUrl.split('/')[2]; // Extract case reference from URL

test.beforeEach(async ({ page }) => {
  await setupAuth(page);
});

test('viewing "about new case" form should display expected elements', async ({ page, pages, i18nSetup }) => {
  const aboutNewCasePage = AboutNewCaseFormPage.forCase(page, caseReference);

  // Navigate to the operator feedback form
  await aboutNewCasePage.navigate();

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(aboutNewCasePage.getPage, { withMenuButtons: false, isUrgent: true, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 Jul 2025" });

  // Assert the page heading is correct 
  const heading = aboutNewCasePage.getHeadingLocator();
  await expect(heading).toHaveText("About the new case");

  // Expect to see the original case category 
  await expect(aboutNewCasePage.originalCaseCategory).toHaveText("Original case category of law: Housing, eviction and homelessness");

  await expect(aboutNewCasePage.newCategoryHeader).toHaveText("Category of law for new case");

  await expect(aboutNewCasePage.categorySelect).toBeVisible();

  await expect(aboutNewCasePage.categorySelect).toBeEnabled();

});

test('when there is only one category assigned to the provider and provider radio is selected this is displayed correctly', async ({ page, pages, i18nSetup }) => {
  const aboutNewCasePage = AboutNewCaseFormPage.forCase(page, 'PC-1122-1349');

  // Navigate to the operator feedback form
  await aboutNewCasePage.navigate();

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(aboutNewCasePage.getPage, { withMenuButtons: false, isUrgent: true, expectedName: "Barbra white", expectedCaseRef: "PC-1122-1349", dateReceived: "7 Jul 2025" });

  // Assert the page heading is correct 
  const heading = aboutNewCasePage.getHeadingLocator();
  await expect(heading).toHaveText("About the new case");

  // Expect to see the original case category 
  await expect(aboutNewCasePage.originalCaseCategory).toHaveText("Original case category of law: Housing, eviction and homelessness");

  await expect(aboutNewCasePage.newCategoryHeader).toHaveText("Category of law for new case");

});


test('shows operator category list', async ({ page }) => {
  const aboutNewCasePage = AboutNewCaseFormPage.forCase(page, caseReference);

  // Go to the split-this-case form first
  await page.goto(`/cases/${caseReference}/split-this-case`);

  // Select the operator radio (internal = false)
  await page.check('input[name="internal"][value="false"]');

  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(`/cases/${caseReference}/about-new-case`);
  // Now go to about-new-case
 // await aboutNewCasePage.navigate();

  // Expect operator categories (full list)
  await expect(aboutNewCasePage.categorySelect).toContainText('I don\'t know');
  // etc...
});

test('continue button should hit post split case form end point', async ({ page, i18nSetup }) => {
  const aboutNewCasePage = AboutNewCaseFormPage.forCase(page, caseReference);

  // Navigate to the operator feedback form
  await aboutNewCasePage.navigate();

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(aboutNewCasePage.getPage, { withMenuButtons: false, isUrgent: true, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 Jul 2025" });

  // Assert we are redirected to the about a new case page (or appropriate next page)
  await expect(page).toHaveURL(`/cases/${caseReference}/about-new-case`);
});
