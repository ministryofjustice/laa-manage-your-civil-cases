import { test, expect } from './fixtures/index.js';
import { t, getClientDetailsUrlByStatus } from './helpers/index.js';
import { EditEmailPage } from './pages/EditEmailPage.js';

test('viewing change email-address form, to see the expected elements', async ({ page, i18nSetup }) => {
  const editEmailPage = new EditEmailPage(page);

  // Navigate to the email edit form
  await editEmailPage.navigate();

  // Assert all main elements are visible
  await editEmailPage.assertMainElementsVisible();
});


test('change email address form displays validation errors correctly', async ({ page, i18nSetup }) => {
  const editEmailPage = new EditEmailPage(page);

  // Navigate to the change form and test validation
  await editEmailPage.navigate();
  await editEmailPage.assertInvalidEmailValidation('JackYoungs.com');
});

test('email address edit page should be accessible', {
  tag: '@accessibility',
}, async ({ page, checkAccessibility }) => {
  const editEmailPage = new EditEmailPage(page);
  await editEmailPage.navigate();
  await checkAccessibility();
});