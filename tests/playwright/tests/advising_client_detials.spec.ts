import { test, expect } from '../fixtures/index.js';
import { t, getClientDetailsUrlByStatus, setupAuth } from '../utils/index.js';

// Login before each test since client details pages require authentication
test.beforeEach(async ({ page }) => {
  await setupAuth(page);
});

test('client details selected from advising cases tab has correct page elements', async ({ page, i18nSetup }) => {
  // Navigate to the client details
  await page.goto(getClientDetailsUrlByStatus('accepted'));

  const advising_tag = page.getByText('Advising', { exact: true });
  const generate_legal_help_form_button = page.getByRole('button', { name: t('pages.caseDetails.buttons.generateLegalHelpForm') });
  const reject_case_button = page.getByRole('button', { name: t('pages.caseDetails.buttons.rejectCase') });
  const split_case_button = page.getByRole('button', { name: t('pages.caseDetails.buttons.splitCase') });
  const close_case_button = page.getByRole('button', { name: t('pages.caseDetails.buttons.closeCase') });
  const leave_feedback_button = page.getByRole('button', { name: t('pages.caseDetails.buttons.leaveFeedback') });

  // expect to see the following elements

  await expect(advising_tag).toBeVisible();
  await expect(generate_legal_help_form_button).toBeVisible();
  await expect(reject_case_button).toBeVisible();
  await expect(split_case_button).toBeVisible();
  await expect(close_case_button).toBeVisible();
  await expect(leave_feedback_button).toBeVisible();
});

test('accepted client details page should be accessible', {
  tag: '@accessibility',
}, async ({ page, checkAccessibility }) => {
  await page.goto(getClientDetailsUrlByStatus('accepted'));
  await checkAccessibility();
});
