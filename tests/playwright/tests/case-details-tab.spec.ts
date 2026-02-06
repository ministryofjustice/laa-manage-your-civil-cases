import { test, expect } from '../fixtures/index.js';
import { assertCaseDetailsHeaderPresent, setupAuth, t } from '../utils/index.js';
import { CaseDetailsTabPage } from '../pages/index.js';

test.describe('Case details tab', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test('should display main elements of case details page', async ({ page, i18nSetup }) => {
    const caseDetails = CaseDetailsTabPage.forCase(page, 'PC-1922-1879');
    await caseDetails.navigate();

    // Assert the case details header is present
    await assertCaseDetailsHeaderPresent(page, true, "Jack Youngs", "PC-1922-1879", "7 Jul 2025");  
    await caseDetails.expectStatus('New');

    // Check for `Add a Note` jump link
    await expect(caseDetails.noteJumpLink).toBeVisible();
    await expect(caseDetails.noteJumpLink).toContainText(t('pages.caseDetails.caseDetailsSection.noteLabel'));
    await expect(caseDetails.noteJumpLink).toHaveAttribute('href', '#providerNote');

    // Check for `Add a Note` form
    await expect(caseDetails.providerNoteTextarea).toBeVisible();
    await expect(caseDetails.characterCountContainerInputBox).toBeVisible();
    const saveButton = page.getByRole('button', { name: t('common.save') });
    await expect(saveButton).toBeVisible();

    // Check URL
    await expect(page).toHaveURL(caseDetails.url);
  });

  test('clicking `Add a note` link should take user to provider note textarea', async ({ page, i18nSetup }) => {
    const caseDetails = CaseDetailsTabPage.forCase(page, 'PC-1922-1879');
    await caseDetails.navigate();

    // Assert the case details header is present
    await assertCaseDetailsHeaderPresent(page, true, "Jack Youngs", "PC-1922-1879", "7 Jul 2025");  
    await caseDetails.expectStatus('New');

    // Click `Add a note` jump link
    await caseDetails.clickJumpToProviderNote();
    await expect(caseDetails.providerNoteTextarea).toBeVisible();
  });

  test('should show client problem section, when scopeTraversal data present', async ({ page, i18nSetup }) => {
    const caseDetails = CaseDetailsTabPage.forCase(page, 'PC-2211-4466'); // This case has some mock data
    await caseDetails.navigate();

    // Assert the case details header is present
    await assertCaseDetailsHeaderPresent(page, true, "Vinsmoke Sanj", "PC-2211-4466", "8 Aug 2025");
    await caseDetails.expectStatus('New');  

    // `Client problem from check if you can get legal aid` title
    await expect(caseDetails.headingH3ByText(t('pages.caseDetails.caseDetailsSection.clientProblemTitle'))).toBeVisible();

    // Hint text with date & time
    const hintText = page.getByText('19 August 2025') // Not added time as our CI has different timezone
    await expect(hintText).toBeVisible();

    // Bullet list of onward question data
    const onwardQuestionBulletsList = [
      'category: Discrimination',
      'Where did the discrimination happen? Work - including colleagues, employer or employment agency',
      'tell us more about your problem: Some notes about Food'
    ];

    for (const text of onwardQuestionBulletsList) {
      await expect(page.getByText(text, { exact: true })).toBeVisible();
    }

    // Bullet list of assessment status
    const data2 = page.getByText('financial assessment: PASSED', { exact: true });
    await expect(data2).toBeVisible();
  });

  test('should show part of client problem section, when only client_notes is data present', async ({ page, i18nSetup }) => {
    const caseDetails = CaseDetailsTabPage.forCase(page, 'PC-1869-9154'); // This case has client_notes but not scopeTraversal
    await caseDetails.navigate();

    // Assert the case details header is present
    await assertCaseDetailsHeaderPresent(page, true, "Grace Baker", "PC-1869-9154", "8 Aug 2025");
    await caseDetails.expectStatus('Pending');  


    // `Client problem from check if you can get legal aid` title
    await expect(caseDetails.headingH3ByText(t('pages.caseDetails.caseDetailsSection.clientProblemTitle'))).toBeVisible();

    // Hint text with date & time, NOT to be shown 
    const hintText = page.getByText('18 August 2025') // 
    await expect(hintText).not.toBeVisible();

    // Bullet list of assessment status, NOT to be shown
    const data2 = page.getByText('financial assessment: PASSED', { exact: true });
    await expect(data2).not.toBeVisible();

    // Bullet list of client note should be visible
    const clientNotes =  page.getByText('tell us more about your problem: Some notes about beer', { exact: true });
    await expect(clientNotes).toBeVisible();
  });

  test('should show operator diagnosis section, when diagnosis data present', async ({ page, i18nSetup }) => {
    const caseDetails = CaseDetailsTabPage.forCase(page, 'PC-2211-4466'); // This case has some mock data
    await caseDetails.navigate();

    // Assert the case details header is present
    await assertCaseDetailsHeaderPresent(page, true, "Vinsmoke Sanj", "PC-2211-4466", "8 Aug 2025");
    await caseDetails.expectStatus('New');  

    // `Operator scope diagnosis` title
    await expect(caseDetails.headingH3ByText(t('pages.caseDetails.caseDetailsSection.operatorDiagnosisTitle'))).toBeVisible();

    // Bullet list of onward question data
    const diagnosisNodeBulletsList = [
      'category: Debt',
      'Debt and housing - loss of home',
      'Homeless or at risk of becoming homeless within 56 days',
      'The landlord has unlawfully evicted the client without due process'
    ];

    for (const text of diagnosisNodeBulletsList) {
      await expect(page.getByText(text, { exact: true })).toBeVisible();
    }
  });

  test('should show operator notes section, when notes data is present', async ({ page, i18nSetup }) => {
    const caseDetails = CaseDetailsTabPage.forCase(page, 'PC-2211-4466'); // This case has some mock data
    await caseDetails.navigate();

    // Assert the case details header is present
    await assertCaseDetailsHeaderPresent(page, true, "Vinsmoke Sanj", "PC-2211-4466", "8 Aug 2025");
    await caseDetails.expectStatus('New');  


    // `Operator scope diagnosis` title
    await expect(caseDetails.headingH3ByText(t('pages.caseDetails.caseDetailsSection.operatorDiagnosisTitle'))).toBeVisible();

    // Notes from operator
    const operatorNotes = page.getByText('Operator notes for Sanji', { exact: true });
    await expect(operatorNotes).toBeVisible();
  });

  test('should show provider notes section, when notesHistory & provider_notes are present', async ({ page, i18nSetup }) => {
    const caseDetails = CaseDetailsTabPage.forCase(page, 'PC-2211-4466'); // This case has some mock data
    await caseDetails.navigate();

    // Assert the case details header is present
    await assertCaseDetailsHeaderPresent(page, true, "Vinsmoke Sanj", "PC-2211-4466", "8 Aug 2025");
    await caseDetails.expectStatus('New');  


    // `Operator scope diagnosis` title
    await expect(caseDetails.headingH3ByText(t('pages.caseDetails.caseDetailsSection.operatorDiagnosisTitle'))).toBeVisible();

    // Notes from operator
    const operatorNotes = page.getByText('These are some test provider notes', { exact: true });
    await expect(operatorNotes).toBeVisible();
  });

  test('should show provider notes section title and "no notes" text, when notesHistory & provider_notes DO NOT exist', async ({ page, i18nSetup }) => {
    const caseDetails = CaseDetailsTabPage.forCase(page, 'PC-1922-1879');
    await caseDetails.navigate();

    // Assert the case details header is present
    await assertCaseDetailsHeaderPresent(page, true, "Jack Youngs", "PC-1922-1879", "7 Jul 2025");  
    await caseDetails.expectStatus('New');

    // `Notes from provider` title
    await expect(page.getByRole('heading', { level: 3, name: t('pages.caseDetails.caseDetailsSection.providerNotesTitle') })).toBeVisible();

    // When no `providerNotes`, the `noNotes` text should appear
    await expect(page.locator('main')).toContainText(t('pages.caseDetails.caseDetailsSection.noNotes'));
  });

  test('case details tab should be accessible', { tag: '@accessibility' }, async ({ page, checkAccessibility }) => {
    const caseDetails = CaseDetailsTabPage.forCase(page, 'PC-1922-1879');
    await caseDetails.navigate();
    await checkAccessibility();
  });
});