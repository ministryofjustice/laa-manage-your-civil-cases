import { test, expect } from '@playwright/test';

test('viewing change email-address form, to see the expected elements', async ({ page }) => {
  const emailInput = page.locator('#emailAddress');
  const saveButton = page.getByRole('button', { name: 'Save' });

  // Navigate to the `/change/email-address`
  await page.goto('/cases/PC-1922-1879/client-details/change/email-address');

  // Expect to see the following elements
  await expect(page.locator('h1')).toContainText("Client's email address (optional)");
  await expect(emailInput).toBeVisible();
  await expect(saveButton).toBeVisible();
});


test('change email address form displays validation errors correctly', async ({ page }) => {
  const saveButton = page.getByRole('button', { name: 'Save' });
  const errorSummary = page.locator('.govuk-error-summary');
  const errorLink = page.locator('.govuk-error-summary a[href="#emailAddress"]');
  const errorMessage = page.locator('.govuk-error-message');
  const emailInput = page.locator('#emailAddress');

  // Navigate to the change form
  await page.goto('/cases/PC-1922-1879/client-details/change/email-address');

  // Submit form with invalid email
  await page.locator('#emailAddress').fill('JackYoungs.com');

  // Find and click the save button
  await expect(saveButton).toBeVisible();
  await saveButton.click();

  // Should stay on same page (not redirect)
  expect(page.url()).toContain('/change/email-address');

  // Check GOV.UK error summary appears
  await expect(errorSummary).toBeVisible();
  await expect(errorSummary).toContainText('There is a problem');

  // Check error summary links to problem field
  await expect(errorLink).toBeVisible();
  // Check field-level error styling
  await expect(emailInput).toHaveClass(/govuk-input--error/);

  // Check error message appears near the field
  await expect(errorMessage).toBeVisible();
  await expect(errorMessage).toContainText('Enter an email address in the correct format, like name@example.com');
});