import { test, expect } from '@playwright/test';

test('viewing change date of birth form, to see the expected elements', async ({ page }) => {
  const dayInput = page.locator('#dateOfBirth-day');
  const monthInput = page.locator('#dateOfBirth-month');
  const yearInput = page.locator('#dateOfBirth-year');
  const saveButton = page.getByRole('button', { name: /Save/i });
  
  // Navigate to the `/edit/date-of-birth`
  await page.goto('/cases/PC-1922-1879/client-details/edit/date-of-birth');
  
  // Expect to see the following elements
  await expect(page.locator('h1')).toContainText("Client's date of birth");
  await expect(dayInput).toBeVisible();
  await expect(monthInput).toBeVisible();
  await expect(yearInput).toBeVisible();
  await expect(saveButton).toBeVisible();
});
