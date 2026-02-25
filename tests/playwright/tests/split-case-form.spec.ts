import { test, expect } from '../fixtures/index.js';
import { SplitCaseFormPage } from '../pages/SplitCaseFormPage.js';
import { setupAuth, assertCaseDetailsHeaderPresent, getClientDetailsUrlByStatus } from '../utils/index.js';

const clientDetailsUrl = getClientDetailsUrlByStatus('default');
const caseReference = clientDetailsUrl.split('/')[2]; // Extract case reference from URL


test.describe('Split Case Form', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });


  test('viewing split case form should display expected elements', async ({ page, pages, i18nSetup }) => {
    const splitCasePage = SplitCaseFormPage.forCase(page, caseReference);
    console.log(clientDetailsUrl);
   // Navigate to the operator feedback form
    await splitCasePage.navigate();

   // Assert the case details header is present
   await assertCaseDetailsHeaderPresent(splitCasePage.getPage, { withMenuButtons: false, isUrgent: true, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 Jul 2025" }); 
  });

});