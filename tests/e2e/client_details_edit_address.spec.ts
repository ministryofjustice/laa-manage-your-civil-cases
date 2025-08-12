import { test, expect } from '@playwright/test';

test('viewing change address form, to see the expected elements', async ({ page }) => {
  const addressInput = page.locator('#address');
  const postcodeInput = page.locator('#postcode');
  const saveButton = page.getByRole('button', { name: 'Save' });

  // Navigate to the `/edit/address`
  await page.goto('/cases/PC-1922-1879/client-details/edit/address');

  // Expect to see the following elements
  await expect(page.locator('h1')).toContainText("Client's contact address (optional)");
  await expect(addressInput).toBeVisible();
  await expect(postcodeInput).toBeVisible();
  await expect(saveButton).toBeVisible();
  
  // Note: Form pre-population testing requires mock data service configuration
  // For now, we test the form structure without specific data expectations
});

test('unchanged fields trigger change detection error (AC5)', async ({ page }) => {
  const saveButton = page.getByRole('button', { name: 'Save' });
  const errorSummary = page.locator('.govuk-error-summary');

  // Navigate to the edit form
  await page.goto('/cases/PC-1922-1879/client-details/edit/address');

  // Fill in form with values and set hidden existing fields to same values
  // This simulates what would happen when form is pre-populated and user doesn't change anything
  await page.evaluate(() => {
    const addressField = document.querySelector('#address') as HTMLInputElement;
    const postcodeField = document.querySelector('#postcode') as HTMLInputElement;
    const form = document.querySelector('form');
    
    if (addressField && postcodeField && form) {
      // Set form values
      addressField.value = 'Test Address';
      postcodeField.value = 'SW1A 1AA';
      
      // Add hidden existing values that match current values (to trigger AC5)
      const existingAddressInput = document.createElement('input');
      existingAddressInput.type = 'hidden';
      existingAddressInput.name = 'existingAddress';
      existingAddressInput.value = 'Test Address';
      form.appendChild(existingAddressInput);
      
      const existingPostcodeInput = document.createElement('input');
      existingPostcodeInput.type = 'hidden';
      existingPostcodeInput.name = 'existingPostcode';
      existingPostcodeInput.value = 'SW1A 1AA';
      form.appendChild(existingPostcodeInput);
    }
  });

  // Submit form (should trigger AC5 validation error)
  await expect(saveButton).toBeVisible();
  await saveButton.click();

  // Check GOV.UK error summary appears for change detection
  await expect(errorSummary).toBeVisible();
  await expect(errorSummary).toContainText('There is a problem');
  await expect(errorSummary).toContainText('Update the client address, update the postcode, or select \'Cancel\'');
  
  // AC5 change detection error should NOT have inline field error messages
  const addressErrorMessage = page.locator('#address-error');
  const postcodeErrorMessage = page.locator('#postcode-error');
  await expect(addressErrorMessage).not.toBeVisible();
  await expect(postcodeErrorMessage).not.toBeVisible();
});
