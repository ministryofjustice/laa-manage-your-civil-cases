import { test, expect } from './fixtures/index.js';
import { t, getClientDetailsUrlByStatus } from './helpers/index.js';

test('client details selected from closed cases tab has correct page elements', async ({ page, i18nSetup }) => {
  // Navigate to the client details
  await page.goto(getClientDetailsUrlByStatus('closed'));

  const closed_tag = page.getByText('Closed', { exact: true });
  const reopen_case_button = page.getByRole('button', { name: t('pages.caseDetails.buttons.reopenCase') })
  const legal_help_from_button = page.getByRole('button', { name: t('pages.caseDetails.buttons.generateLegalHelpForm') })

  // expect to see the following elements
  await expect(closed_tag).toBeVisible();
  await expect(reopen_case_button).toBeVisible();
  await expect(legal_help_from_button).toBeVisible();
});
