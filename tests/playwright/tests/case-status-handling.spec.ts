import { test, expect } from '../fixtures/index.js';
import { setupAuth } from '../utils/index.js';

// NOTE: These tests are currently skipped because the UI implementation is incomplete.
// The menu items in views/case_details/_case-info-partial.njk have placeholder href="#" values.
// To enable these tests, update the menu items to have proper URLs:
// - /cases/:ref/accept for accepting (POST)
// - /cases/:ref/why-pending for pending form (GET)
// - /cases/:ref/why-closed for close form (GET)
// - /cases/:ref/completed for completing (POST)
// - /cases/:ref/why-reopen for reopen form (GET)

test.describe('Case Status Handling', () => {
  test.describe('Accept Case', () => {
    test.skip('should accept a new case', async ({ page }) => {
      // TODO: Uncomment when menu items have proper hrefs
      await setupAuth(page);
      await page.goto('/cases/PC-1922-1879');
      await expect(page.locator('h1')).toContainText('Jack Youngs');

      await page.click('button#change-case-status-menu');
      await page.click('a:has-text("Advising")');

      await expect(page).toHaveURL('/cases/PC-1922-1879');
      await expect(page.locator('.govuk-tag')).toContainText('Advising');
    });
  });

  test.describe('Mark Case as Pending', () => {
    test.skip('should display pending form', async ({ page }) => {
      // TODO: Uncomment when menu items have proper hrefs
      await setupAuth(page);
      await page.goto('/cases/PC-1922-1879');
      
      await page.click('button#change-case-status-menu');
      await page.click('a:has-text("Pending")');

      await expect(page).toHaveURL('/cases/PC-1922-1879/why-pending');
      await expect(page.locator('h1')).toContainText('Why is this case pending?');
    });

    test.skip('should submit pending form', async ({ page }) => {
      // TODO: Uncomment when pending form route is implemented
      await setupAuth(page);
      await page.goto('/cases/PC-1922-1879/why-pending');

      await page.selectOption('select[name="event_code"]', 'SPFM');
      await page.fill('textarea[name="notes"]', 'Awaiting further information');
      await page.click('button[type="submit"]');

      await expect(page).toHaveURL('/cases/PC-1922-1879');
      await expect(page.locator('.govuk-tag')).toContainText('Pending');
    });
  });

  test.describe('Close Case', () => {
    test.skip('should display close case form', async ({ page }) => {
      // TODO: Uncomment when menu items have proper hrefs
      await setupAuth(page);
      await page.goto('/cases/PC-3184-5962');
      
      await page.click('button#change-case-status-menu');
      await page.click('a:has-text("Closed")');

      await expect(page).toHaveURL('/cases/PC-3184-5962/why-closed');
      await expect(page.locator('h1')).toContainText('Why are you closing this case?');
    });

    test.skip('should submit close case form', async ({ page }) => {
      // TODO: Uncomment when close form route is implemented
      await setupAuth(page);
      await page.goto('/cases/PC-3184-5962/why-closed');

      await page.selectOption('select[name="event_code"]', 'CLSP');
      await page.fill('textarea[name="notes"]', 'Case successfully closed');
      await page.click('button[type="submit"]');

      await expect(page).toHaveURL('/cases/PC-3184-5962');
      await expect(page.locator('.govuk-tag')).toContainText('Closed');
    });

    test.skip('should validate required fields', async ({ page }) => {
      // TODO: Uncomment when close form route is implemented
      await setupAuth(page);
      await page.goto('/cases/PC-3184-5962/why-closed');

      await page.click('button[type="submit"]');

      await expect(page.locator('.govuk-error-summary')).toBeVisible();
    });
  });

  test.describe('Complete Case', () => {
    test.skip('should complete an advising case', async ({ page }) => {
      // TODO: Uncomment when menu items have proper hrefs
      await setupAuth(page);
      await page.goto('/cases/PC-3184-5962');
      await expect(page.locator('h1')).toContainText('Ember Hamilton');

      await page.click('button#change-case-status-menu');
      await page.click('a:has-text("Completed")');

      await expect(page).toHaveURL('/cases/PC-3184-5962');
      await expect(page.locator('.govuk-tag')).toContainText('Completed');
    });
  });

  test.describe('Reopen Case', () => {
    test.skip('should display reopen case form', async ({ page }) => {
      // TODO: Uncomment when menu items have proper hrefs
      await setupAuth(page);
      await page.goto('/cases/PC-4575-7150');
      
      await page.click('button#change-case-status-menu');
      await page.click('a:has-text("Advising")');

      await expect(page).toHaveURL('/cases/PC-4575-7150/why-reopen');
      await expect(page.locator('h1')).toContainText('Why are you reopening this case?');
    });

    test.skip('should submit reopen case form', async ({ page }) => {
      // TODO: Uncomment when reopen form route is implemented
      await setupAuth(page);
      await page.goto('/cases/PC-4575-7150/why-reopen');

      await page.selectOption('select[name="event_code"]', 'REAS');
      await page.fill('textarea[name="notes"]', 'Client requested case to be reopened');
      await page.click('button[type="submit"]');

      await expect(page).toHaveURL('/cases/PC-4575-7150');
      await expect(page.locator('.govuk-tag')).toContainText('Advising');
    });
  });
});
