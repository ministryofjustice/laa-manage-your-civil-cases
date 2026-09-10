import { expect, test } from '../fixtures/index.js';
import { setupAuth, assertCaseDetailsHeaderPresent, assertSummaryCardData, assertSummaryCardState } from '../utils/index.js';
import { EditEmailPage } from '../pages/EditEmailPage.js';

test.beforeEach(async ({ page }) => {
  await setupAuth(page);
});

test('viewing change email-address form, to see the expected elements', async ({ page, i18nSetup }) => {
  const editEmailPage = new EditEmailPage(page);

  // Navigate to the email edit form
  await editEmailPage.navigate();

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, { withMenuButtons: false, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 July 2025", badgeTexts: ['Urgent', 'At risk of abuse', 'Third Party'] });

  // Assert all main elements are visible
  await editEmailPage.assertMainElementsVisible();
});

test('change email address form displays validation errors correctly', async ({ page, i18nSetup }) => {
  const editEmailPage = new EditEmailPage(page);

  // Navigate to the change form and test validation
  await editEmailPage.navigate();
  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, { withMenuButtons: false, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 July 2025", badgeTexts: ['Urgent', 'At risk of abuse', 'Third Party'] });

  await editEmailPage.assertInvalidEmailValidation('JackYoungs.com');
});

test('shows warning banner when email is not changed', async ({ page, i18nSetup }) => {
  const editEmailPage = new EditEmailPage(page);

  await editEmailPage.navigate();

  await assertCaseDetailsHeaderPresent(page, { withMenuButtons: false, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 July 2025", badgeTexts: ['Urgent', 'At risk of abuse', 'Third Party'] });

  await editEmailPage.waitForLoad();

  await editEmailPage.submitUnchangedEmail();

  // assert redirect
  await editEmailPage.expectSuccessfulSubmission();

  // assert warning banner 
  await editEmailPage.expectNoChangeWarningBanner('No changes were made');

  // Assert support needs summary card is visible with no data 
  await assertSummaryCardState(page, { cardId: 'Client support needs', emptyText: 'No support needs', hasData: false, addHref: '/client-details/add/support-need' });
  // Assert third party details summary card is visible with no data
  await assertSummaryCardState(page, { cardId: 'Third party contact', emptyText: 'No third party contact required', hasData: true, changeHref: '/client-details/change/third-party', removeHref: '/confirm/remove-third-party' });
  // Assert the data in the third party details summary card is correct
  await assertSummaryCardData(page, 'Third party contact', { 'Name': 'Sarah Johnson', 'Phone number': 'Warning Not safe to call', 'Email address': 'sarah@johnson.com', 'Address': '45 Main Street, Sheffield S1 2AB', 'Relationship to client': 'Family member or friend', 'Passphrase': 'TestPass123' });
});

test('when there is a valid email update this is updated', async ({ page, i18nSetup }) => {
  const clientDetailsUrl = `/cases/PC-1922-1879/client-details`;
  const editEmailPage = new EditEmailPage(page);

  await editEmailPage.navigate();

  await assertCaseDetailsHeaderPresent(page, { withMenuButtons: false, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 July 2025", badgeTexts: ['Urgent', 'At risk of abuse', 'Third Party'] });

  await editEmailPage.fillEmailAddress('wibblewobble@mail.coy')

  // assert redirect
  await editEmailPage.clickSave();

  // Should redirect to client details page
  await expect(page).toHaveURL(clientDetailsUrl);

  const contactDetailsCard = page.locator('.govuk-summary-card').filter({has: page.getByRole('heading', { name: 'Contact details' }),});

  await expect(contactDetailsCard.locator('.govuk-summary-list__row').filter({ has: page.getByText('Email address', { exact: true }) }).locator('.govuk-summary-list__value')).toHaveText('wibblewobble@mail.coy');

  // Assert support needs summary card is visible with no data 
  await assertSummaryCardState(page, { cardId: 'Client support needs', emptyText: 'No support needs', hasData: false, addHref: '/client-details/add/support-need' });
  // Assert third party details summary card is visible with no data
  await assertSummaryCardState(page, { cardId: 'Third party contact', emptyText: 'No third party contact required', hasData: true, changeHref: '/client-details/change/third-party', removeHref: '/confirm/remove-third-party' });
  // Assert the data in the third party details summary card is correct
  await assertSummaryCardData(page, 'Third party contact', { 'Name': 'Sarah Johnson', 'Phone number': 'Warning Not safe to call', 'Email address': 'sarah@johnson.com', 'Address': '45 Main Street, Sheffield S1 2AB', 'Relationship to client': 'Family member or friend', 'Passphrase': 'TestPass123' });
});

const invalidEmails = [
  'wibblewobble@mail.',
  'wibblewobble@',
  'wibblewobble',
  'wibblewobble@&makeup.coy',
  'wibblewobble@^makeup.coy',
  'wibblewobble@%makeup.coy',
  'wibblewobble@$makeup.coy',
  'wibblewobble@!makeup.coy'
];

for (const invalidEmail of invalidEmails) {
  test(`email validation rejects "${invalidEmail}"`, async ({ page, i18nSetup }) => {
    const editEmailPage = new EditEmailPage(page);

    await editEmailPage.navigate();

    await editEmailPage.fillEmailAddress(invalidEmail);

    await editEmailPage.clickSave();

    // Should remain on edit page
    await expect(page).toHaveURL('/cases/PC-1922-1879/client-details/change/email-address');

    // Error summary
    await expect(page.locator('.govuk-error-summary')).toBeVisible();

    await expect(page.locator('.govuk-error-summary__title')).toHaveText('There is a problem');

    await expect(page.locator('.govuk-error-summary__list')).toContainText('Enter an email address in the correct format, like name@example.com');

    // Field-level validation message
    await expect(page.locator('#emailAddress-error')).toContainText('Enter an email address in the correct format, like name@example.com');
  });
}

test('email address edit page should be accessible', {
  tag: '@accessibility',
}, async ({ page, checkAccessibility }) => {
  const editEmailPage = new EditEmailPage(page);
  await editEmailPage.navigate();
  await checkAccessibility();
});