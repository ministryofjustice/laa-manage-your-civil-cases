import { test, expect } from '../fixtures/index.js';
import { getClientDetailsUrlByStatus, setupAuth, assertCaseDetailsHeaderPresent, assertSummaryCardState, assertSummaryCardData } from '../utils/index.js';

// Login before each test since client details pages require authentication
test.beforeEach(async ({ page }) => {
  await setupAuth(page);
});

test('client details selected from advising cases tab has correct page elements', async ({ page, i18nSetup }) => {
  // Navigate to the client details
  await page.goto(getClientDetailsUrlByStatus('accepted'));

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, { withMenuButtons: true, expectedName: "Ember Hamilton", expectedCaseRef: "PC-3184-5962", dateReceived: "9 January 2025", badgeTexts: ['At risk of abuse', 'Third Party'] });

  // Assert support needs summary card is visible with no data 
  await assertSummaryCardState(page, { cardId: 'Client support needs', emptyText: 'No support needs', hasData: false, addHref: '/client-details/add/support-need' });
  // Assert third party details summary card is visible with data
  await assertSummaryCardState(page, { cardId: 'Third party contact', emptyText: 'No third party contact required', hasData: true, changeHref: '/client-details/change/third-party', removeHref: '/confirm/remove-third-party' });
  // Assert the data in the summary card is correct
  await assertSummaryCardData(page, 'Third party contact', { 'Name': 'Chris Green', 'Phone number': '0786304271', 'Email address': 'chris@green.com', 'Address': '22 Baker Street, London NW1 6XE', 'Relationship to client': 'Other' });

  const advising_tag = page.getByText('Advising', { exact: true });
  const changeStatusButton = page.getByRole('button', { name: 'Change status' });
  const completedMenuItem = page.getByRole('button', { name: 'Completed' });

  // expect to see the following elements
  await expect(advising_tag).toBeVisible();
  await expect(changeStatusButton).toBeVisible();

  // After opening the menu, the "Completed" option should be visible
  await changeStatusButton.click();
  await expect(completedMenuItem).toBeVisible();
});

test('accepted client details page should be accessible', {
  tag: '@accessibility',
}, async ({ page, checkAccessibility }) => {
  await page.goto(getClientDetailsUrlByStatus('accepted'));
  await checkAccessibility();
});
