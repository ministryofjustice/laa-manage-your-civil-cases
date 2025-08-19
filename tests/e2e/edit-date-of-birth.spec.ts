import { test, expect } from '@playwright/test';

test('viewing edit date of birth form should display expected elements', async ({ page }) => {
  const dayInput = page.locator('#dateOfBirth-day');
  const monthInput = page.locator('#dateOfBirth-month');
  const yearInput = page.locator('#dateOfBirth-year');
  const saveButton = page.getByRole('button', { name: 'Save' });
  const cancelLink = page.getByRole('link', { name: 'Cancel' });
  
  // Navigate to the date of birth edit form
  await page.goto('/cases/PC-1922-1879/client-details/change/date-of-birth');
  
  // Expect to see the main elements
  await expect(page.locator('h1')).toContainText("Client date of birth");
  await expect(dayInput).toBeVisible();
  await expect(monthInput).toBeVisible();
  await expect(yearInput).toBeVisible();
  await expect(saveButton).toBeVisible();
  await expect(cancelLink).toBeVisible();
  
  // Check hint text is present
  await expect(page.locator('.govuk-hint')).toContainText('For example, 27 3 2007');
  
  // Check back link is present - use specific class to avoid selector conflicts
  await expect(page.locator('.govuk-back-link')).toBeVisible();
});

test('cancel link should navigate back to client details', async ({ page }) => {
  const cancelLink = page.getByRole('link', { name: 'Cancel' });
  
  // Navigate to the date of birth edit form
  await page.goto('/cases/PC-1922-1879/client-details/change/date-of-birth');
  
  // Click cancel link
  await cancelLink.click();
  
  // Should navigate back to client details
  await expect(page).toHaveURL('/cases/PC-1922-1879/client-details');
});

test('save button should redirect to client details when no validation errors', async ({ page }) => {
  const saveButton = page.getByRole('button', { name: 'Save' });
  
  // Navigate to the date of birth edit form
  await page.goto('/cases/PC-1922-1879/client-details/change/date-of-birth');
  
  // Fill in a valid date
  await page.locator('#dateOfBirth-day').fill('15');
  await page.locator('#dateOfBirth-month').fill('5');
  await page.locator('#dateOfBirth-year').fill('1990');
  
  // Also populate the hidden original fields to simulate proper change detection
  // This works around the API service not providing original data in e2e tests
  await page.evaluate(() => {
    (document.querySelector('input[name="originalDay"]') as HTMLInputElement).value = '10';
    (document.querySelector('input[name="originalMonth"]') as HTMLInputElement).value = '3';
    (document.querySelector('input[name="originalYear"]') as HTMLInputElement).value = '1985';
  });
  
  // Click save button
  await saveButton.click();
  
  // Wait a moment for potential processing
  await page.waitForTimeout(1000);
  
  // Check if there are validation errors (debug info)
  const errorSummary = page.locator('.govuk-error-summary');
  const hasErrors = await errorSummary.isVisible();
  
  if (hasErrors) {
    console.log('Validation errors found:');
    const errorMessages = await page.locator('.govuk-error-summary__list li').allTextContents();
    console.log(errorMessages);
  }
  
  // Should redirect to client details
  await expect(page).toHaveURL('/cases/PC-1922-1879/client-details');
});
