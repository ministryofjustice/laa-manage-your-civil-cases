import { test, expect } from '../fixtures/index.js';
import { setupAuth } from '../utils/index.js';
import { ClientDetailsPage, PendingCaseFormPage, CloseCaseFormPage, ReopenCaseFormPage } from '../pages/index.js';

test.describe('Case Status Handling', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test.describe('Accept Case', () => {
    test('should show case status', async ({ page }) => {
      const clientDetails = ClientDetailsPage.forCase(page, 'PC-1922-1879');
      await clientDetails.navigate();
      await clientDetails.expectClientName('Jack Youngs');
      await clientDetails.expectStatus('New');
    });
  });

  test.describe('Mark Case as Pending', () => {
    test('should display pending form correctly', async ({ page }) => {
      const pendingPage = PendingCaseFormPage.forCase(page, 'PC-1922-1879');
      await pendingPage.navigate();
      await pendingPage.expectFormLoaded();
      await pendingPage.expectReasonOptionVisible('Third party authorisation');
      await expect(pendingPage.saveButton).toBeVisible();
    });

    test('why-pending form should be accessible', {
      tag: '@accessibility',
    }, async ({ page, checkAccessibility }) => {
      const pendingPage = PendingCaseFormPage.forCase(page, 'PC-1922-1879');
      await pendingPage.navigate();
      await checkAccessibility();
    });
  });

  test.describe('Close Case', () => {
    test('should submit close case form', async ({ page }) => {
      const closePage = CloseCaseFormPage.forCase(page, 'PC-4575-7150');
      await closePage.navigate();
      await closePage.submitWithData('MIS-MEANS', 'Case successfully closed');

      const clientDetails = ClientDetailsPage.forCase(page, 'PC-4575-7150');
      await expect(page).toHaveURL(clientDetails.url);
      await clientDetails.expectStatus('Closed');
    });

    test('should validate required fields', async ({ page }) => {
      const closePage = CloseCaseFormPage.forCase(page, 'PC-4575-7150');
      await closePage.navigate();
      await closePage.clickSave();

      await closePage.expectErrorSummaryVisible();
    });

    test('why-closed form should be accessible', {
      tag: '@accessibility',
    }, async ({ page, checkAccessibility }) => {
      const closePage = CloseCaseFormPage.forCase(page, 'PC-3184-5962');
      await closePage.navigate();
      await checkAccessibility();
    });
  });

  test.describe('Complete Case', () => {
    test('should show completed case status', async ({ page }) => {
      const clientDetails = ClientDetailsPage.forCase(page, 'PC-3184-5962');
      await clientDetails.navigate();
      await clientDetails.expectClientName('Ember Hamilton');
      // Accepted status from API displays as Advising with light-blue tag
      await clientDetails.expectStatus('Advising');
    });
  });

  test.describe('Reopen Case', () => {
    test('should submit reopen case form', async ({ page }) => {
      const reopenPage = ReopenCaseFormPage.forCase(page, 'PC-4575-7150');
      await reopenPage.navigate();
      await reopenPage.submitWithNote('Client requested case to be reopened');

      // After reopening, the controller redirects to /cases/advising (not back to client details)
      await expect(page).toHaveURL('/cases/advising');
    });

    test('why-reopen form should be accessible', {
      tag: '@accessibility',
    }, async ({ page, checkAccessibility }) => {
      const reopenPage = ReopenCaseFormPage.forCase(page, 'PC-4575-7150');
      await reopenPage.navigate();
      await checkAccessibility();
    });
  });
});
