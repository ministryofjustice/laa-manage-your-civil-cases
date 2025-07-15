import { test, expect } from '@playwright/test';

test('client details selected from opened cases tab has correct page elements', async ({ page }) => {
  // Navigate to the client details
  await page.goto('/cases/PC-1922-1879/client-details');

  const new_tag = page.locator('.govuk-tag--orange');
  const accept_case_button = page.getByRole('button', { name: 'Accept case' })
  const reject_case_button = page.getByRole('button', { name: 'Reject case' })
  const split_case_button = page.getByRole('button', { name: 'Split case' })
  const leave_feedback_button = page.getByRole('button', { name: 'Leave feedback' })

  // expect to see the following elements
  expect(new_tag).toBeVisible;
  expect(accept_case_button).toBeVisible;
  expect(reject_case_button).toBeVisible;
  expect(split_case_button).toBeVisible;
  expect(leave_feedback_button).toBeVisible;
});
