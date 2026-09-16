import { test } from '../fixtures/index.js';
import { setupAuth, assertCaseDetailsHeaderPresent, assertSummaryCardData, assertSummaryCardState } from '../utils/index.js';

const emptyClientDiversityDataUrl = '/cases/PC-1922-1879/client-details';
const populatedClientDiversityDataUrl = '/cases/PC-2211-4466/client-details';
const populatedWithPreferNotToSayClientDiversityDataUrl = '/cases/PC-7755-4557/client-details';

test.beforeEach(async ({ page }) => {
  await setupAuth(page);
});

test('can see EMPTY client diversity data when viewing the client details tab', async ({ page }) => {
  // Navigate to client details tab
  await page.goto(emptyClientDiversityDataUrl);

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, { withMenuButtons: true, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 Jul 2025 at", badgeTexts: ['Urgent', 'At risk of abuse', 'Third Party'], dateOfBirth: "18 Aug 1981 (45)" });
  
  // Expect to see the main elements of client diversity data summary card
  await assertSummaryCardState(page, { cardId: 'Diversity data', emptyText: 'Not provided', hasData: false });
  await assertSummaryCardData(page, 'Diversity data', { 'Gender': 'Not provided', 'Ethnic origin': 'Not provided', 'Disabilities': 'Not provided' });
});

test('can see POPULATED client diversity data when viewing the client details tab', async ({ page, i18nSetup }) => {
  // Navigate to client details tab, using PC-2211-4466, which has diversity data populated via MSW handler 
  await page.goto(populatedClientDiversityDataUrl);

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, { withMenuButtons: false, expectedName: "Vinsmoke Sanji", expectedCaseRef: "PC-2211-4466", dateReceived: "8 Aug 2025 at", badgeTexts: ['At risk of abuse', 'Third Party', 'Translation', 'Text relay', 'BSL'], dateOfBirth: "12 Nov 1979 (46)" });
  
  // Expect to see populated elements of client diversity data summary card
  await assertSummaryCardState(page, { cardId: 'Diversity data', emptyText: 'Not provided', hasData: true });
  await assertSummaryCardData(page, 'Diversity data', { 'Gender': 'Male', 'Ethnic origin': 'Mixed Other', 'Disabilities': 'OTH - Other' });
});

test('can see POPULATED WITH PREFER NOT TO SAY client diversity data when viewing the client details tab', async ({ page, i18nSetup }) => {
  // Navigate to client details tab, using PC-7755-4557, which has diversity data populated with "Prefer not to say" via MSW handler
  await page.goto(populatedWithPreferNotToSayClientDiversityDataUrl);

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, { withMenuButtons: false, expectedName: "Alan Turning", expectedCaseRef: "PC-7755-4557", dateReceived: "9 Jan 2025 at", badgeTexts: ['At risk of abuse', 'Third Party'], dateOfBirth: "10 Jun 1977 (49)" });

  // Expect to see populated elements of client diversity data summary card
  await assertSummaryCardState(page, { cardId: 'Diversity data', emptyText: 'Not provided', hasData: true });
  await assertSummaryCardData(page, 'Diversity data', { 'Gender': 'Prefer not to say', 'Ethnic origin': 'Prefer not to say', 'Disabilities': 'NCD - Not Considered Disabled' });
});
