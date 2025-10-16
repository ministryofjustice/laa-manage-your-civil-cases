import { test, expect } from '../fixtures/index.js';

// test.describe('Edit Client Name', () => {
//   test('viewing change name form should display expected elements', async ({ pages, i18nSetup }) => {
//     const editNamePage = pages.editName;
//     await editNamePage.navigate();
//     await editNamePage.expectPageLoaded(editNamePage.getExpectedHeading());
//   });

//   test('cancel link should navigate back to client details', async ({ pages, i18nSetup }) => {
//     await pages.editName.expectCancelNavigatesBack();
//   });

//   test('save button should redirect to client details when valid data submitted', async ({ pages, i18nSetup }) => {
//     const editNamePage = pages.editName;
//     await editNamePage.submitWithValidName('John Updated Smith');
//     await editNamePage.expectSuccessfulSubmission();
//   });

//   test('name form displays validation errors correctly', async ({ pages, i18nSetup }) => {
//     const editNamePage = pages.editName;
//     await editNamePage.submitWithEmptyName();
//     await editNamePage.expectErrorSummaryVisible();
    
//     // Check individual field error appears
//     await expect(editNamePage.nameError).toBeVisible();
//   });

//   test('unchanged name triggers change detection error', async ({ pages, i18nSetup }) => {
//     const editNamePage = pages.editName;
//     await editNamePage.submitWithoutChanges();
//     await editNamePage.expectErrorSummaryVisible();
    
//     // Check that the error summary contains the expected change detection message
//     const errorSummary = editNamePage.errorSummary;
//     await expect(errorSummary).toContainText("Change the client name");
//   });

//   test('name edit page should be accessible', {
//     tag: '@accessibility',
//   }, async ({ pages, checkAccessibility }) => {
//     await pages.editName.navigate();
//     await checkAccessibility();
//   });
// });