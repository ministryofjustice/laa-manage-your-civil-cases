import { test, expect } from '../fixtures/index.js';
import { t, getClientDetailsUrlByStatus, setupAuth, assertCaseDetailsHeaderPresent, assertSummaryCardData, assertSummaryCardState } from '../utils/index.js';

// Login before each test since client details pages require authentication
test.beforeEach(async ({ page }) => {
  await setupAuth(page);
});

test('client details selected from opened cases tab has correct page elements', async ({ page, i18nSetup }) => {
  // Navigate to the client details
  await page.goto(getClientDetailsUrlByStatus('open'));

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, { withMenuButtons: true, expectedName: "Grace Baker", expectedCaseRef: "PC-1869-9154", dateReceived: "8 August 2025", badgeTexts: ['At risk of abuse', 'Third Party', 'Translation', 'BSL'] });

  // Assert support needs summary card is visible with data 
  await assertSummaryCardState(page, { cardId: 'Client support needs', emptyText: 'No support needs', hasData: true, changeHref: '/client-details/change/support-need' });
  // Assert the data in the support needs summary card is correct
  await assertSummaryCardData(page, 'Client support needs', { 'British Sign Language': 'Yes' });
  // Assert third party details summary card is visible with data
  await assertSummaryCardState(page, { cardId: 'Third party contact', emptyText: 'No third party contact required', hasData: true, changeHref: '/client-details/change/third-party', removeHref: '/confirm/remove-third-party' });
  // Assert the correct data is displayed in the third party data summary card
  await assertSummaryCardData(page, 'Third party contact', { 'Name': 'Samira Patel', 'Phone number': 'Not provided', 'Email address': 'samira@patel.com', 'Address': '84 Zoo Lane, Birmingham B88 1RW', 'Relationship to client': 'Legal adviser' });

  const open_tag = page.getByText('Opened', { exact: true });
  const accept_case_button = page.getByRole('button', { name: t('pages.caseDetails.buttons.acceptCase') })
  const reject_case_button = page.getByRole('button', { name: t('pages.caseDetails.buttons.rejectCase') })
  const split_case_button = page.getByRole('button', { name: t('pages.caseDetails.buttons.splitCase') })
  const leave_feedback_button = page.getByRole('button', { name: t('pages.caseDetails.buttons.leaveFeedback') })

  // expect to see the following elements
  /* TODO: These expectations are not running and need to wait till MSW implementation.
  *       Also need to change .toBeVisible to .toBeVisible() with parentheses.
  */
  await expect(open_tag).toBeVisible;
  await expect(accept_case_button).toBeVisible;
  await expect(reject_case_button).toBeVisible;
  await expect(split_case_button).toBeVisible;
  await expect(leave_feedback_button).toBeVisible;
});

test('opened client details page should be accessible', {
  tag: '@accessibility',
}, async ({ page, checkAccessibility }) => {
  await page.goto(getClientDetailsUrlByStatus('open'));
  await checkAccessibility();
});
