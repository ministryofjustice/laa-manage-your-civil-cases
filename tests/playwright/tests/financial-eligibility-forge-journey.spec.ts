import { test, expect } from '../fixtures/index.js';
import { setupAuth, assertCaseDetailsHeaderPresent } from '../utils/index.js';

test.describe('Financial Eligibility Forge Journey', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test.describe('Discard changes functionality', () => {
    test('should show interstitial page, when pressing `Discard changes` link', async ({ page }) => {
      await page.goto('/cases/PC-1922-1879/financial-eligibility/change');

      // Start answering questions
      await page.getByRole('radio', { name: 'Yes' }).check();

      // Click discard changes button
      const discardLink = page.getByRole('link', { name: 'Discard changes' })
      await discardLink.click();

      // Should show interstitial page
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/discard');
    });

    test('should return to previous step, when pressing `Return to means assessment` link', async ({ page }) => {
      await page.goto('/cases/PC-1922-1879/financial-eligibility/change');

      // Navigate to partner step
      await page.getByRole('radio', { name: 'No' }).check();
      await page.getByRole('button', { name: 'Continue' }).click();
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/has-partner');

      const discardLink = page.getByRole('link', { name: 'Discard changes' });
      await expect(discardLink).toHaveAttribute('href', '/cases/PC-1922-1879/financial-eligibility/change/discard');
      await discardLink.click();

      // On the Interstitial page
      const returnToMeansAssessmentLink = page.getByRole('link', { name: 'Return to means assessment' })
      await expect(returnToMeansAssessmentLink).toHaveAttribute('href', '/cases/PC-1922-1879/financial-eligibility/change/has-partner');
      await returnToMeansAssessmentLink.click();
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/has-partner');
      await expect(page.getByRole('radio', { name: 'No' })).toBeChecked();
    });
    
    test('should discard changes and return to financial eligibility overview', async ({ page }) => {
      await page.goto('/cases/PC-1922-1879/financial-eligibility/change');

      // Navigate to partner step
      await page.getByRole('radio', { name: 'No' }).check();
      await page.getByRole('button', { name: 'Continue' }).click();
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/change/has-partner');

      const discardLink = page.getByRole('link', { name: 'Discard changes' });
      await expect(discardLink).toHaveAttribute('href', '/cases/PC-1922-1879/financial-eligibility/change/discard');
      await discardLink.click();

      // On the Interstitial page
      const discardButton = page.getByRole('button', { name: 'Discard changes' });
      await discardButton.click();
      await expect(page).toHaveURL('/cases/PC-1922-1879/financial-eligibility/');
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
