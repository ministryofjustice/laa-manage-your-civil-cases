import { test, expect } from '../fixtures/index.js';
import { t, getClientDetailsUrlByStatus, setupAuth, assertCaseDetailsHeaderPresent } from '../utils/index.js';

// Login before each test since client details pages require authentication
test.beforeEach(async ({ page }) => {
  await setupAuth(page);
});

test('client details selected from opened cases tab has correct page elements', async ({ page, i18nSetup }) => {
  // Navigate to the client details
  await page.goto(getClientDetailsUrlByStatus('open'));

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, { withMenuButtons: true, expectedName: "Grace Baker", expectedCaseRef: "PC-1869-9154", dateReceived: "8 Aug 2025" });  

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
