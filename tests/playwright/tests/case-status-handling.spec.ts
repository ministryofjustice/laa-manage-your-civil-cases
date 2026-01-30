import { test, expect } from '../fixtures/index.js';
import { setupAuth, assertCaseDetailsHeaderPresent} from '../utils/index.js';
import { ClientDetailsPage, PendingCaseFormPage, CloseCaseFormPage, ReopenCaseFormPage } from '../pages/index.js';


test.describe('Case Status Handling', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test.describe('Accept Case', () => {
    test('should show case status', async ({ page }) => {
      const clientDetails = ClientDetailsPage.forCase(page, 'PC-1922-1879');
      await clientDetails.navigate();

      // Assert the case details header is present
      await assertCaseDetailsHeaderPresent(page, true, "Jack Youngs", "PC-1922-1879", "7 Jul 2025");  

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

    test('should be able to click Advising and hit endpoint', async ({ page }) => {
      const clientDetails = ClientDetailsPage.forCase(page, 'PC-1922-1866');

      await clientDetails.navigate();
      // Assert the case details header is present
      await assertCaseDetailsHeaderPresent(page, true, "Katie Young", "PC-1922-1866", "7 Jul 2025");  

      await clientDetails.expectStatus('New');

      // Click `Change status` button
      const toggle = page.getByRole('button', { name: 'Change status' });
      await expect(toggle).toBeVisible();
      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');

      // Click advising and send a post request. 
      const advisingButton = page.getByRole('button', { name: 'Advising' })
      await advisingButton.click();

      await expect(page).toHaveURL(clientDetails.url);
      await expect(page.locator('.govuk-tag--light-blue')).toHaveText('Advising');
    });

    test('Move a closed case to advising', async ({ page }) => {
      const clientDetails = ClientDetailsPage.forCase(page, 'PC-4532-2312');

      await clientDetails.navigate();
      // Assert the case details header is present
      await assertCaseDetailsHeaderPresent(page, true, "Zechariah Twelve", "PC-4532-2312", "6 Jan 2025"); 

      await clientDetails.expectStatus('Closed');

      // Click `Change status` button
      const toggle = page.getByRole('button', { name: 'Change status' });
      await expect(toggle).toBeVisible();
      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');

      // Click advising and send a post request. 
      const advisingButton = page.getByRole('button', { name: 'Advising' })
      await advisingButton.click();

      // Add note and save. 
      await expect(page).toHaveURL(`/cases/PC-4532-2312/why-reopen-closed-case`);
      const adviseNote = page.locator('textarea[name="reopenNote"]');
      await adviseNote.fill("Needs more advise")
      const save = page.getByRole('button', { name: 'Save' });
      await save.click();

      await expect(page.locator('.govuk-tag--light-blue')).toHaveText('Advising');
    });
  });

  test.describe('Mark Case as Pending', () => {
    test('should display pending form correctly', async ({ page }) => {
      const pendingPage = PendingCaseFormPage.forCase(page, 'PC-1922-1879');
      await pendingPage.navigate();
      // Assert the case details header is present
      await assertCaseDetailsHeaderPresent(page, false, "Jack Youngs", "PC-1922-1879", "7 Jul 2025");  
      await pendingPage.expectFormLoaded();
      await pendingPage.expectReasonOptionVisible('Third party authorisation');
      await expect(pendingPage.saveButton).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
      const pendingPage = PendingCaseFormPage.forCase(page, 'PC-1922-1879');
      await pendingPage.navigate();
      // Assert the case details header is present
      await assertCaseDetailsHeaderPresent(page, false, "Jack Youngs", "PC-1922-1879", "7 Jul 2025");  
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
      const closePage = CloseCaseFormPage.forCase(page, 'PC-9159-2337');
      await closePage.navigate();
      // Assert the case details header is present
      await assertCaseDetailsHeaderPresent(page, false, "Noah Brown", "PC-4575-7150", "6 Jan 2025"); 
      await closePage.submitWithData('MIS-MEANS', 'Case successfully closed');

      const clientDetails = ClientDetailsPage.forCase(page, 'PC-9159-2337');
      await expect(page).toHaveURL(clientDetails.url);
      await clientDetails.expectStatus('Closed');
    });

    test('should validate required fields', async ({ page }) => {
      const closePage = CloseCaseFormPage.forCase(page, 'PC-2211-4466');
      await closePage.navigate();
      // Assert the case details header is present
      await assertCaseDetailsHeaderPresent(page, false, "Noah Brown", "PC-4575-7150", "6 Jan 2025"); 
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
    test('should be able to click Completed and hit endpoint', async ({ page }) => {
      const clientDetails = ClientDetailsPage.forCase(page, 'PC-3184-5962');

      await clientDetails.navigate();
      // Assert the case details header is present
      await assertCaseDetailsHeaderPresent(page, true, "Ember Hamilton", "PC-3184-5962", "9 Jan 2025"); 
      
      await clientDetails.expectStatus('Advising');

      // Click `Change status` button
      const toggle = page.getByRole('button', { name: 'Change status' });
      await expect(toggle).toBeVisible();
      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');

      // Click completed and send a post request. 
      const completedButton = page.getByRole('button', { name: 'Completed' })
      await completedButton.click();

      await expect(page).toHaveURL(clientDetails.url);
      await expect(page.locator('.govuk-tag--pink')).toHaveText('Completed');
    });

  });

  test.describe('Reopen Case', () => {
    test('should submit reopen case form', async ({ page }) => {
      const reopenPage = ReopenCaseFormPage.forCase(page, 'PC-1122-3344');
      await reopenPage.navigate();
      // Assert the case details header is present
      await assertCaseDetailsHeaderPresent(page, false, "Noah Brown", "PC-4575-7150", "6 Jan 2025"); 
      await reopenPage.submitWithNote('Client requested case to be reopened');

      const clientDetails = ClientDetailsPage.forCase(page, 'PC-1122-3344');
      await expect(page).toHaveURL(clientDetails.url);
    });

    test('why-reopen-completed-case form should be accessible', {
      tag: '@accessibility',
    }, async ({ page, checkAccessibility }) => {
      const reopenPage = ReopenCaseFormPage.forCase(page, 'PC-1122-3344');
      await reopenPage.navigate();
      await checkAccessibility();
    });
  });
});