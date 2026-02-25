import { test } from '../fixtures/index.js';
import { setupAuth, assertCaseDetailsHeaderPresent, getClientDetailsUrlByStatus } from '../utils/index.js';
import { SplitThisCaseFormPage } from '../pages/SplitCaseFormPage.js';

const clientDetailsUrl = getClientDetailsUrlByStatus('default');
const caseReference = clientDetailsUrl.split('/')[2]; // Extract case reference from URL

test.beforeEach(async ({ page }) => {
  await setupAuth(page);
});

test('viewing "split this case" form should display expected elements', async ({ page, pages, i18nSetup }) => {  
  const splitCasePage = SplitThisCaseFormPage.forCase(page, caseReference);

  // Navigate to the operator feedback form
  await splitCasePage.navigate();

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(splitCasePage.getPage, { withMenuButtons: false, isUrgent: true, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 Jul 2025" });
});
