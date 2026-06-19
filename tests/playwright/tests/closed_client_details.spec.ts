import { test, expect } from '../fixtures/index.js';
import { getClientDetailsUrlByStatus, setupAuth, assertCaseDetailsHeaderPresent, assertSummaryCardData, assertSummaryCardState } from '../utils/index.js';

// Login before each test since client details pages require authentication
test.beforeEach(async ({ page }) => {
  await setupAuth(page);
});

test('client details selected from closed cases tab has correct page elements', async ({ page, i18nSetup }) => {
  // Navigate to the client details
  await page.goto(getClientDetailsUrlByStatus('closed'));

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, { withMenuButtons: true, expectedName: "Roronoa Zoro", expectedCaseRef: "PC-6667-9089", dateReceived: "6 January 2025", badgeTexts: ['At risk of abuse', 'Third Party'] });

  // Assert support needs summary card is visible with no data 
  await assertSummaryCardState(page, { cardId: 'Client support needs', emptyText: 'No support needs', hasData: false, addHref: '/client-details/add/support-need' });
  // Assert third party details summary card is visible with no data
  await assertSummaryCardState(page, { cardId: 'Third party contact', emptyText: 'No third party contact required', hasData: true, changeHref: '/client-details/change/third-party', removeHref: '/confirm/remove-third-party' });
  // Assert the data in the third party details summary card is correct
  await assertSummaryCardData(page, 'Third party contact', { 'Name': 'Nami Rivers', 'Phone number': 'Not provided', 'Email address': 'nami@rivers.com', 'Address': '22 Baker Street, London NW1 6XE', 'Relationship to client': 'Legal adviser', 'Passphrase': 'Warlord of the Sea' });

  const closed_tag = page.getByText('Closed', { exact: true });
  const changeStatusButton = page.getByRole('button', { name: 'Change status' });
  const advisingMenuItem = page.getByRole('button', { name: 'Advising' });
  const alertBanner = page.locator('.mcc-alert-banner');

  // expect to see the following elements
  await expect(closed_tag).toBeVisible();
  await expect(changeStatusButton).toBeVisible();
  await expect(alertBanner).toBeVisible();

  // After opening the menu, the "Advising" option should be visible
  await changeStatusButton.click();
  await expect(advisingMenuItem).toBeVisible();
});

test('client support needs card is shown with no support needs on new case when `minicom` is true and `skype` is false', async ({ page, i18nSetup }) => {
  // Navigate to the client details
  await page.goto(getClientDetailsUrlByStatus('closed'));

  await assertCaseDetailsHeaderPresent(page, { withMenuButtons: true, expectedName: "Roronoa Zoro", expectedCaseRef: "PC-6667-9089", dateReceived: "6 January 2025", badgeTexts: ['At risk of abuse', 'Third Party'] });

  // Assert support needs summary card is visible with no data 
  await assertSummaryCardState(page, { cardId: 'Client support needs', emptyText: 'No support needs', hasData: false, addHref: '/client-details/add/support-need' });
  // Assert third party details summary card is visible with no data
  await assertSummaryCardState(page, { cardId: 'Third party contact', emptyText: 'No third party contact required', hasData: true, changeHref: '/client-details/change/third-party', removeHref: '/confirm/remove-third-party' });
  // Assert the data in the third party details summary card is correct
  await assertSummaryCardData(page, 'Third party contact', { 'Name': 'Nami Rivers', 'Phone number': 'Not provided', 'Email address': 'nami@rivers.com', 'Address': '22 Baker Street, London NW1 6XE', 'Relationship to client': 'Legal adviser', 'Passphrase': 'Warlord of the Sea' });
});


test('closed client details page should be accessible', {
  tag: '@accessibility',
}, async ({ page, checkAccessibility }) => {
  await page.goto(getClientDetailsUrlByStatus('closed'));
  await checkAccessibility();
});
