import { test, expect } from '../fixtures/index.js';
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

  // Assert the page heading is correct 
  const heading = splitCasePage.getHeadingLocator();
  await expect(heading).toHaveText("Split this case");

  const guidancePara = page.getByText(
    /You must not open more than one case for a client unless the client has more than one separate and distinct legal problem\./i,
    { exact: false }
  );
  await expect(guidancePara).toBeVisible();

  // Link inside the paragraph: locate by accessible name
  const guidanceLink = page.getByRole('link', {
    name: /Check 5\.20 of page 35 of the guidance \(PDF, 599KB\)/i,
  });

  // Assert it’s visible
  await expect(guidanceLink).toBeVisible();

  // Assert attributes exactly
  await expect(guidanceLink).toHaveAttribute(
    'href',
    'https://assets.publishing.service.gov.uk/media/679a1a75fe19800263dc7b86/2_2025_Civil_Legal_Advice_Contract_Annex_1_Specification.pdf#page=35'
  );
  await expect(guidanceLink).toHaveAttribute('target', '_blank');
  await expect(guidanceLink).toHaveAttribute('rel', /(^|\s)noopener(\s|$)/);
  await expect(guidanceLink).toHaveAttribute('rel', /(^|\s)noreferrer(\s|$)/);

  // (Optional) assert the link’s accessible name
  await expect(guidanceLink).toHaveAccessibleName(
    /Check 5\.20 of page 35 of the guidance \(PDF, 599KB\)/i
  );

  await expect(
    page.getByRole('group', { name: /Who should the new case be assigned to\?/i })
  ).toBeVisible();

  const radioInternalTrue = page.getByRole('radio', { name: 'Generic Provider Public Law' });
  await expect(radioInternalTrue).toBeVisible();
  await expect(radioInternalTrue).not.toBeChecked();

  const radioInternalFalse = page.getByRole('radio', { name: 'To operator for reassignment' });
  await expect(radioInternalFalse).toBeVisible();
  await expect(radioInternalFalse).toBeChecked(); // Default selection

});
