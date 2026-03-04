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

});

test('continue button should hit post split case form end point', async ({ page, i18nSetup }) => {
  const aboutNewCasePage = AboutNewCaseFormPage.forCase(page, caseReference);

  // Navigate to the operator feedback form
  await aboutNewCasePage.navigate();

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(aboutNewCasePage.getPage, { withMenuButtons: false, isUrgent: true, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 Jul 2025" });

  // Select the "Generic Provider Public Law" radio option
  const radioInternalTrue = page.getByRole('radio', { name: 'Generic Provider Public Law' });
  await radioInternalTrue.check();

  // Click the continue button
  const continueButton = page.getByRole('button', { name: 'Continue' });
  await continueButton.click();

  // Assert we are redirected to the about a new case page (or appropriate next page)
  await expect(page).toHaveURL(`/cases/${caseReference}/about-new-case`);
});
