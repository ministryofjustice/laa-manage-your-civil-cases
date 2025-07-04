import { test, expect } from '@playwright/test';

test('client details selected from closed cases tab has correct page elements', async ({ page }) => {
  // Navigate to the client details
  await page.goto('/cases/closed/:caseReference/client-details');

  const new_tag = page.locator('.govuk-tag');
  const reopen_case_button = page.getByRole('button', {name: 'Reopen case'})
  const legal_help_from_button = page.getByRole('button', {name: 'Generate legal help form'})

  // expect to see the following elements
  expect(new_tag).toBeVisible;
  expect(reopen_case_button).toBeVisible;
  expect(legal_help_from_button).toBeVisible;
});
