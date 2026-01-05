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
      await expect(page).toHaveURL(clientDetails.url);
    });
  
    test('accepted case should be accessible', {
      tag: '@accessibility',
    }, async ({ page, checkAccessibility }) => {
      const clientDetails = ClientDetailsPage.forCase(page, 'PC-1922-1879');
      await clientDetails.navigate();
      await checkAccessibility();
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

      test('should validate required fields', async ({ page }) => {
      const pendingPage = PendingCaseFormPage.forCase(page, 'PC-1922-1879');
      await pendingPage.navigate();
      await pendingPage.clickSave();
      await pendingPage.expectErrorSummaryVisible();
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
   
    
test('should change status to Completed and show alert', async ({ page }) => {
  const clientDetails = ClientDetailsPage.forCase(page, 'PC-3184-5962');

  await clientDetails.navigate();
  await clientDetails.expectClientName('Ember Hamilton');
  await clientDetails.expectStatus('Advising');

  
  const toggle = page.getByRole('button', { name: 'Change status' });
  await expect(toggle).toBeVisible();

  await toggle.click();

  await expect(toggle).toHaveAttribute('aria-expanded', 'true');

  const menuContainer = page.locator('.moj-button-menu');
  await expect(menuContainer).toBeVisible({ timeout: 3000 });

  const completedCandidate =
      page.getByRole('button', { name: 'Completed' })
 

  await expect(completedCandidate).toBeVisible({ timeout: 3000 });
  // Click completed and send a post request. 
  await completedCandidate.click();

  //await clientDetails.navigate();

  const alert = page.getByText('Completed');
  await expect(alert).toBeVisible();

});

    test('Completed case should be accessible', {
      tag: '@accessibility',
    }, async ({ page, checkAccessibility }) => {
      const clientDetails = ClientDetailsPage.forCase(page, 'PC-1922-1879');
      await clientDetails.navigate();
      await checkAccessibility();
    });

  });

  test.describe('Reopen Case', () => {
    test('should submit reopen case form', async ({ page }) => {
      const reopenPage = ReopenCaseFormPage.forCase(page, 'PC-4575-7150');
      await reopenPage.navigate();
      await reopenPage.submitWithNote('Client requested case to be reopened');

      const clientDetails = ClientDetailsPage.forCase(page, 'PC-4575-7150');
      await expect(page).toHaveURL(clientDetails.url);
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
