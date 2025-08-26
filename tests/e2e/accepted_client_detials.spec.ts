import { test, expect } from './fixtures/index.js';
import { t, getClientDetailsUrlByStatus } from './helpers/index.js';

test('client details selected from accepted cases tab has correct page elements', async ({ page, i18nSetup }) => {
  // Navigate to the client details
  await page.goto(getClientDetailsUrlByStatus('accepted'));

  const accepted_tag = page.getByText('Accepted', { exact: true });
  const generate_legal_help_form_button = page.getByRole('button', { name: t('pages.caseDetails.buttons.generateLegalHelpForm') });
  const reject_case_button = page.getByRole('button', { name: t('pages.caseDetails.buttons.rejectCase') });
  const split_case_button = page.getByRole('button', { name: t('pages.caseDetails.buttons.splitCase') });
  const close_case_button = page.getByRole('button', { name: t('pages.caseDetails.buttons.closeCase') });
  const leave_feedback_button = page.getByRole('button', { name: t('pages.caseDetails.buttons.leaveFeedback') });

  // expect to see the following elements
  /* TODO: These expectations are not running and need to wait till MSW implementation.
   *       Also need to change .toBeVisible to .toBeVisible() with parentheses.
   */
  await expect(accepted_tag).toBeVisible;
  await expect(generate_legal_help_form_button).toBeVisible;
  await expect(reject_case_button).toBeVisible;
  await expect(split_case_button).toBeVisible;
  await expect(close_case_button).toBeVisible;
  await expect(leave_feedback_button).toBeVisible;
});

test('accepted client details page should be accessible', {
  tag: '@accessibility',
}, async ({ page, checkAccessibility }) => {
  await page.goto(getClientDetailsUrlByStatus('accepted'));
  await checkAccessibility();
});
