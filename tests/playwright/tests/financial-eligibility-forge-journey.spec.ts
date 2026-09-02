import { test, expect } from '../fixtures/index.js';
import { setupAuth, assertCaseDetailsHeaderPresent } from '../utils/index.js';

test.describe('Financial Eligibility Forge Journey', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test.describe('Discard changes functionality', () => {
    test('should allow discarding changes and return to financial eligibility overview', async ({ page }) => {
      await page.goto('/cases/PC-1922-1879/financial-eligibility/change');

      // Start answering questions
      await page.getByRole('radio', { name: 'Yes' }).check();
      
      // Click discard changes button
      const discardButton = page.getByRole('button', { name: 'Discard changes' });
      await discardButton.click();

      // Should return to financial eligibility overview (not the `/change` path)
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/');
      await expect(page).not.toHaveURL(/\/change/);
    });

    test('should allow discarding from any step in the journey', async ({ page }) => {
      await page.goto('/cases/PC-1922-1879/financial-eligibility/change');

      // Navigate to partner step
      await page.getByRole('radio', { name: 'No' }).check();
      await page.getByRole('button', { name: 'Continue' }).click();

      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/has-partner');
      
      // Discard from this step
      const discardButton = page.getByRole('button', { name: 'Discard changes'});
      await discardButton.click();

      // Should return to financial eligibility overview
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/');
          
    });

    test('should return to the step where discard changes was selected', async ({ page }) => {
      await page.goto('/cases/PC-1922-1879/financial-eligibility/change');

      await page.getByRole('radio', { name: 'No' }).check();
      await page.getByRole('button', { name: 'Continue' }).click();
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/has-partner');

      const discardChangesLink = page.getByRole('link', { name: 'Discard changes' });
      await expect(discardChangesLink).toHaveAttribute(
        'href',
        '/cases/PC-1922-1879/financial-eligibility/change/discard',
      );
      await discardChangesLink.click();
      await page.getByRole('link', { name: 'Return to means assessment' }).click();

      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/has-partner');
      await expect(page.getByRole('radio', { name: 'No' })).toBeChecked();
    });
  });

  test.describe('Journey persistence and navigation', () => {
    test('should maintain answers when navigating back and forth', async ({ page }) => {
      await page.goto('/cases/PC-1922-1879/financial-eligibility/change');

      // Answer first question
      await page.getByRole('radio', { name: 'No' }).check(); // Under 18: No
      await page.getByRole('button', { name: 'Continue' }).click();

      // Answer second question
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/has-partner');
      await page.getByRole('radio', { name: 'Yes' }).check(); // Partner = Yes
      await page.getByRole('button', { name: 'Continue' }).click();

      // Navigate back using browser back button
      await page.goBack();

      // Verify the answer is still selected
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/has-partner');
      const yesRadio = page.getByRole('radio', { name: 'Yes' });
      await expect(yesRadio).toBeChecked();
    });
  });

  test.describe('Accessibility', () => {
    test('journey start page should be accessible', async ({ page, checkAccessibility }) => {
      await page.goto('/cases/PC-1922-1879/financial-eligibility/change');
      await checkAccessibility();
    });

    test('partner step should be accessible', async ({ page, checkAccessibility }) => {
      // Navigate to partner step
      await page.goto('/cases/PC-1922-1879/financial-eligibility/change/has-partner');
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/has-partner');
      await checkAccessibility();
    });

    test('benefits step should be accessible', async ({ page, checkAccessibility }) => {
      // Navigate to benefits step
      await page.goto('/cases/PC-1922-1879/financial-eligibility/change/benefits');
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/benefits');
      await checkAccessibility();
    });

    test('check answers page should be accessible', async ({ page, checkAccessibility }) => {
      // Navigate to check answers
      await page.goto('/cases/PC-1922-1879/financial-eligibility/change/check-answers');
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/check-answers');
      await checkAccessibility();
    });
  });
});
