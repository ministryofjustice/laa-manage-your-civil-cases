import { test, expect } from './fixtures/index.js';
import { t, getClientDetailsUrlByStatus } from './helpers/index.js';

test('client details selected from new cases tab has correct page elements', async ({ page, i18nSetup }) => {
  // Navigate to the client details
  await page.goto(getClientDetailsUrlByStatus('new'));

  const new_tag = page.getByText('New', { exact: true });
  const accept_case_button = page.getByRole('button', { name: t('pages.caseDetails.buttons.acceptCase') })
  const reject_case_button = page.getByRole('button', { name: t('pages.caseDetails.buttons.rejectCase') })
  const split_case_button = page.getByRole('button', { name: t('pages.caseDetails.buttons.splitCase') })
  const leave_feedback_button = page.getByRole('button', { name: t('pages.caseDetails.buttons.leaveFeedback') })

  // expect to see the following elements
  /* TODO: These expectations are not running and need to wait till MSW implementation.
  *       Also need to change .toBeVisible to .toBeVisible() with parentheses.
  */
  await expect(new_tag).toBeVisible;
  await expect(accept_case_button).toBeVisible;
  await expect(reject_case_button).toBeVisible;
  await expect(split_case_button).toBeVisible;
  await expect(leave_feedback_button).toBeVisible;
});

test('new client details page should be accessible', {
  tag: '@accessibility',
}, async ({ page, checkAccessibility }) => {
  await page.goto(getClientDetailsUrlByStatus('new'));
  await checkAccessibility();
});
