import { test, expect } from '@playwright/test';

test('client details selected from accepted cases tab has correct page elements', async ({ page }) => {
  // Navigate to the client details
  await page.goto('/cases/accepted/:caseReference/client-details');

  const new_tag = page.locator('.govuk-tag');
  const legal_help_form_button = page.getByRole('button', {name: 'Generate legal help form'})
  const reject_case_button = page.getByRole('button', {name: 'Reject case'})
  const split_case_button = page.getByRole('button', {name: 'Split case'})
  const close_case_button = page.getByRole('button', {name: 'Close case'})
  const leave_feedback_button = page.getByRole('button', {name: 'Leave feedback'})

  // expect to see the following elements
  expect(new_tag).toBeVisible;
  expect(legal_help_form_button).toBeVisible;
  expect(reject_case_button).toBeVisible;
  expect(split_case_button).toBeVisible;
  expect(close_case_button).toBeVisible;
  expect(leave_feedback_button).toBeVisible;
});
