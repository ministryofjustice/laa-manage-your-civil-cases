import { test, expect } from '@playwright/test';

test('viewing edit date of birth form should display expected elements', async ({ page }) => {
  const dayInput = page.locator('#dateOfBirth-day');
  const monthInput = page.locator('#dateOfBirth-month');
  const yearInput = page.locator('#dateOfBirth-year');
  const saveButton = page.getByRole('button', { name: 'Save' });
  const cancelLink = page.getByRole('link', { name: 'Cancel' });
  
  // Navigate to the date of birth edit form
  await page.goto('/cases/PC-1922-1879/client-details/edit/date-of-birth');
  
  // Expect to see the main elements
  await expect(page.locator('h1')).toContainText("Client's date of birth");
  await expect(dayInput).toBeVisible();
  await expect(monthInput).toBeVisible();
  await expect(yearInput).toBeVisible();
  await expect(saveButton).toBeVisible();
  await expect(cancelLink).toBeVisible();
  
  // Check hint text is present
  await expect(page.locator('.govuk-hint')).toContainText('For example, 27 3 2024');
  
  // Check back link is present
  await expect(page.getByRole('link', { name: 'Back' })).toBeVisible();
});

test('cancel link should navigate back to client details', async ({ page }) => {
  const cancelLink = page.getByRole('link', { name: 'Cancel' });
  
  // Navigate to the date of birth edit form
  await page.goto('/cases/PC-1922-1879/client-details/edit/date-of-birth');
  
  // Click cancel link
  await cancelLink.click();
  
  // Should navigate back to client details
  await expect(page).toHaveURL('/cases/PC-1922-1879/client-details');
});

test('save button should redirect to client details when no validation errors', async ({ page }) => {
  const saveButton = page.getByRole('button', { name: 'Save' });
  
  // Navigate to the date of birth edit form
  await page.goto('/cases/PC-1922-1879/client-details/edit/date-of-birth');
  
  // Fill in a valid date (placeholder behavior - no validation yet)
  await page.locator('#dateOfBirth-day').fill('15');
  await page.locator('#dateOfBirth-month').fill('5');
  await page.locator('#dateOfBirth-year').fill('1990');
  
  // Click save button
  await saveButton.click();
  
  // Should redirect to client details (current placeholder behavior)
  await expect(page).toHaveURL('/cases/PC-1922-1879/client-details');
});
