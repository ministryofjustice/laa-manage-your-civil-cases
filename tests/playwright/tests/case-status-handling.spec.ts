import { test, expect } from '../fixtures/index.js';
import { setupAuth } from '../utils/index.js';

test.describe('Case Status Handling', () => {
  test.describe('Accept Case', () => {
    test('should accept a new case', async ({ page }) => {
      await setupAuth(page);
      await page.goto('/cases/PC-1922-1879/client-details');
      await expect(page.locator('h1')).toContainText('Jack Youngs');

      await page.click('button#change-case-status-menu');
      await page.click('a:has-text("Advising")');

      await expect(page).toHaveURL('/cases/PC-1922-1879/client-details');
      await expect(page.locator('.govuk-tag')).toContainText('Advising');
    });
  });

  test.describe('Mark Case as Pending', () => {
    test('should display pending form', async ({ page }) => {
      await setupAuth(page);
      await page.goto('/cases/PC-1922-1879/client-details');
      
      await page.click('button#change-case-status-menu');
      await page.click('a:has-text("Pending")');

      await expect(page).toHaveURL('/cases/PC-1922-1879/why-pending');
      await expect(page.locator('h1')).toContainText('Why is this case pending?');
    });

    test('should submit pending form', async ({ page }) => {
      await setupAuth(page);
      await page.goto('/cases/PC-1922-1879/why-pending');

      await page.selectOption('select[name="event_code"]', 'SPFM');
      await page.fill('textarea[name="notes"]', 'Awaiting further information');
      await page.click('button[type="submit"]');

      await expect(page).toHaveURL('/cases/PC-1922-1879/client-details');
      await expect(page.locator('.govuk-tag')).toContainText('Pending');
    });

    test('why-pending form should be accessible', {
      tag: '@accessibility',
    }, async ({ page, checkAccessibility }) => {
      await setupAuth(page);
      await page.goto('/cases/PC-1922-1879/why-pending');
      await checkAccessibility();
    });
  });

  test.describe('Close Case', () => {
    test('should display close case form', async ({ page }) => {
      await setupAuth(page);
      await page.goto('/cases/PC-3184-5962/client-details');
      
      await page.click('button#change-case-status-menu');
      await page.click('a:has-text("Closed")');

      await expect(page).toHaveURL('/cases/PC-3184-5962/why-closed');
      await expect(page.locator('h1')).toContainText('Why are you closing this case?');
    });

    test('should submit close case form', async ({ page }) => {
      await setupAuth(page);
      await page.goto('/cases/PC-3184-5962/why-closed');

      await page.selectOption('select[name="event_code"]', 'CLSP');
      await page.fill('textarea[name="notes"]', 'Case successfully closed');
      await page.click('button[type="submit"]');

      await expect(page).toHaveURL('/cases/PC-3184-5962/client-details');
      await expect(page.locator('.govuk-tag')).toContainText('Closed');
    });

    test('should validate required fields', async ({ page }) => {
      await setupAuth(page);
      await page.goto('/cases/PC-3184-5962/why-closed');

      await page.click('button[type="submit"]');

      await expect(page.locator('.govuk-error-summary')).toBeVisible();
    });

    test('why-closed form should be accessible', {
      tag: '@accessibility',
    }, async ({ page, checkAccessibility }) => {
      await setupAuth(page);
      await page.goto('/cases/PC-3184-5962/why-closed');
      await checkAccessibility();
    });
  });

  test.describe('Complete Case', () => {
    test('should complete an advising case', async ({ page }) => {
      await setupAuth(page);
      await page.goto('/cases/PC-3184-5962/client-details');
      await expect(page.locator('h1')).toContainText('Ember Hamilton');

      await page.click('button#change-case-status-menu');
      await page.click('a:has-text("Completed")');

      await expect(page).toHaveURL('/cases/PC-3184-5962/client-details');
      await expect(page.locator('.govuk-tag')).toContainText('Completed');
    });
  });

  test.describe('Reopen Case', () => {
    test('should display reopen case form', async ({ page }) => {
      await setupAuth(page);
      await page.goto('/cases/PC-4575-7150/client-details');
      
      await page.click('button#change-case-status-menu');
      await page.click('a:has-text("Advising")');

      await expect(page).toHaveURL('/cases/PC-4575-7150/why-reopen');
      await expect(page.locator('h1')).toContainText('Why are you reopening this case?');
    });

    test('should submit reopen case form', async ({ page }) => {
      await setupAuth(page);
      await page.goto('/cases/PC-4575-7150/why-reopen');

      await page.selectOption('select[name="event_code"]', 'REAS');
      await page.fill('textarea[name="notes"]', 'Client requested case to be reopened');
      await page.click('button[type="submit"]');

      await expect(page).toHaveURL('/cases/PC-4575-7150/client-details');
      await expect(page.locator('.govuk-tag')).toContainText('Advising');
    });

    test('why-reopen form should be accessible', {
      tag: '@accessibility',
    }, async ({ page, checkAccessibility }) => {
      await setupAuth(page);
      await page.goto('/cases/PC-4575-7150/why-reopen');
      await checkAccessibility();
    });
  });
});
