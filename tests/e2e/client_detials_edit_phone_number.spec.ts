import { test, expect } from '@playwright/test';

test('viewing change phone-number form, to see the expected elements', async ({ page }) => {
  const phoneInput = page.locator('#phoneNumber');
  const safeToCallInput = page.locator('#safeToCall');
  const announceCallInput = page.locator('#announceCall');
  const saveButton = page.getByRole('button', { name: 'Save' });

  // Navigate to the `/edit/phone-number`
  await page.goto('/cases/PC-1922-1879/client-details/edit/phone-number');

  // Expect to see the following elements
  await expect(page.locator('h1')).toContainText("Client phone number");
  await expect(phoneInput).toBeVisible();
  await expect(safeToCallInput).toBeVisible();
  await expect(announceCallInput).toBeVisible();
  await expect(saveButton).toBeVisible();
});

test('phoneNumber is blank and correct validation errors display', async ({ page }) => {
  const saveButton = page.getByRole('button', { name: 'Save' });
  const errorSummary = page.locator('.govuk-error-summary');
  const errorLinkSafeToCall = page.locator('a[href="#safeToCall"]');
  const errorLinkPhoneNumber = page.locator('a[href="#phoneNumber"]');
  const phoneInput = page.locator('#phoneNumber');

  // Navigate to the edit form
  await page.goto('/cases/PC-1922-1879/client-details/edit/phone-number');

  // Submit form with blank phoneNumber
  await page.locator('#phoneNumber').fill('');

  // Find and click the save button
  await expect(saveButton).toBeVisible();
  await saveButton.click();

  // Check GOV.UK error summary appears
  await expect(errorSummary).toBeVisible();
  await expect(errorSummary).toContainText('There is a problem');

  // Check error summary links to problem field
  await expect(errorLinkPhoneNumber).toBeVisible();
  await expect(errorLinkPhoneNumber).toHaveText('Enter the client phone number');
  await expect(phoneInput).toHaveClass(/govuk-input--error/);

  // Check other error summary link not visible
  await expect(errorLinkSafeToCall).not.toBeVisible();
});

test('phoneNumber is not valid and correct validation errors display', async ({ page }) => {
  const saveButton = page.getByRole('button', { name: 'Save' });
  const errorSummary = page.locator('.govuk-error-summary');
  const errorLinkSafeToCall = page.locator('a[href="#safeToCall"]');
  const errorLinkPhoneNumber = page.locator('a[href="#phoneNumber"]');
  const phoneInput = page.locator('#phoneNumber');

  // Navigate to the edit form
  await page.goto('/cases/PC-1922-1879/client-details/edit/phone-number');

  // Submit form with blank phoneNumber
  await page.locator('#phoneNumber').fill('ggg');

  // Find and click the save button
  await expect(saveButton).toBeVisible();
  await saveButton.click();

  // Check GOV.UK error summary appears
  await expect(errorSummary).toBeVisible();
  await expect(errorSummary).toContainText('There is a problem');

  // Check error summary links to problem field
  await expect(errorLinkPhoneNumber).toBeVisible();
  await expect(errorLinkPhoneNumber).toHaveText('Enter the phone number in the correct format');
  await expect(phoneInput).toHaveClass(/govuk-input--error/);

  // Check other error summary link not visible
  await expect(errorLinkSafeToCall).not.toBeVisible();
});

test('safeToCall & phoneNumber & announceCall not changed and correct validation errors displayed', async ({ page }) => {
  const saveButton = page.getByRole('button', { name: 'Save' });
  const errorSummary = page.locator('.govuk-error-summary');

  // Navigate to the `/edit/phone-number`
  await page.goto('/cases/PC-1922-1879/client-details/edit/phone-number');

  // Find and click the save button
  await expect(saveButton).toBeVisible();
  await saveButton.click();

  // Check GOV.UK error summary appears
  await expect(errorSummary).toBeVisible();
  await expect(errorSummary).toContainText('There is a problem');
});

