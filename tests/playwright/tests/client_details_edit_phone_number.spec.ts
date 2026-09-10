import { test, expect } from '../fixtures/index.js';
import { ClientDetailsPage } from '../pages/ClientDetailsPage.js';
import { t, getClientDetailsUrlByStatus, setupAuth, assertCaseDetailsHeaderPresent, assertSummaryCardData, assertSummaryCardState } from '../utils/index.js';

const visitUrl = getClientDetailsUrlByStatus('default') + '/change/phone-number';
const clientDetailsUrl = getClientDetailsUrlByStatus('default');

test.beforeEach(async ({ page }) => {
  await setupAuth(page);
});

test('viewing change phone-number form, to see the expected elements', async ({ page, i18nSetup }) => {
  const phoneInput = page.locator('#phoneNumber');
  const safeToCallInput = page.locator('#safeToCall');
  const announceCallInput = page.locator('#announceCall');
  const saveButton = page.getByRole('button', { name: t('common.save') });

  // Navigate to the `/change/phone-number`
  await page.goto(visitUrl);

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, { withMenuButtons: false, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 July 2025", badgeTexts: ['Urgent', 'At risk of abuse', 'Third Party'] });

  // Expect to see the following elements
  await expect(page.locator('h2.govuk-heading-m')).toContainText(t('forms.clientDetails.phoneNumber.title'));
  await expect(phoneInput).toBeVisible();
  await expect(safeToCallInput).toBeVisible();
  await expect(announceCallInput).toBeVisible();
  await expect(saveButton).toBeVisible();
});

test('phoneNumber is blank and correct validation errors display', async ({ page, i18nSetup }) => {
  const saveButton = page.getByRole('button', { name: t('common.save') });
  const errorSummary = page.locator('.govuk-error-summary');
  const errorLinkSafeToCall = page.locator('a[href="#safeToCall"]');
  const errorLinkPhoneNumber = page.locator('a[href="#phoneNumber"]');
  const phoneInput = page.locator('#phoneNumber');

  // Navigate to the change form
  await page.goto(visitUrl);

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, { withMenuButtons: false, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 July 2025", badgeTexts: ['Urgent', 'At risk of abuse', 'Third Party'] });

  // Submit form with blank phoneNumber
  await page.locator('#phoneNumber').fill('');

  // Find and click the save button
  await expect(saveButton).toBeVisible();
  await saveButton.click();

  // Check GOV.UK error summary appears
  await expect(errorSummary).toBeVisible();
  await expect(errorSummary).toContainText(t('components.errorSummary.title'));

  // Check error summary links to problem field
  await expect(errorLinkPhoneNumber).toBeVisible();
  await expect(errorLinkPhoneNumber).toHaveText(t('forms.clientDetails.phoneNumber.validationError.notEmpty'));
  await expect(phoneInput).toHaveClass(/govuk-input--error/);

  // Check other error summary link not visible
  await expect(errorLinkSafeToCall).not.toBeVisible();
});

test('phoneNumber is not valid and correct validation errors display', async ({ page, i18nSetup }) => {
  const saveButton = page.getByRole('button', { name: t('common.save') });
  const errorSummary = page.locator('.govuk-error-summary');
  const errorLinkSafeToCall = page.locator('a[href="#safeToCall"]');
  const errorLinkPhoneNumber = page.locator('a[href="#phoneNumber"]');
  const phoneInput = page.locator('#phoneNumber');

  // Navigate to the change form
  await page.goto(visitUrl);

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, { withMenuButtons: false, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 July 2025", badgeTexts: ['Urgent', 'At risk of abuse', 'Third Party'] });

  // Submit form with invalid phoneNumber
  await page.locator('#phoneNumber').fill('ggg');

  // Find and click the save button
  await expect(saveButton).toBeVisible();
  await saveButton.click();

  // Check GOV.UK error summary appears
  await expect(errorSummary).toBeVisible();
  await expect(errorSummary).toContainText(t('components.errorSummary.title'));

  // Check error summary links to problem field
  await expect(errorLinkPhoneNumber).toBeVisible();
  await expect(errorLinkPhoneNumber).toHaveText(t('forms.clientDetails.phoneNumber.validationError.invalidFormat'));
  await expect(phoneInput).toHaveClass(/govuk-input--error/);

  // Check other error summary link not visible
  await expect(errorLinkSafeToCall).not.toBeVisible();
});

test('when safe to call and annouce are true when phone number is valid this is saved and user redirect to client details', async ({ page, i18nSetup }) => {
  const phoneInput = page.locator('#phoneNumber');
  const safeToCallRadios = page.locator('[name="safeToCall"]');
  const announceCallRadios = page.locator('[name="announceCall"]');
  const saveButton = page.getByRole('button', { name: t('common.save') });

  // Navigate to the change phone number form
  await page.goto(visitUrl);

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, { withMenuButtons: false, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 July 2025", badgeTexts: ['Urgent', 'At risk of abuse', 'Third Party'] });

  // Fill in valid phone number details
  await phoneInput.fill('07700900123');
  await safeToCallRadios.first().check(); // Select "Yes" for safe to call
  await announceCallRadios.first().check(); // Select "Yes" for announce call

  // Submit the form
  await saveButton.click();

  // Should redirect to client details page
  await expect(page).toHaveURL(clientDetailsUrl);
  const contactDetailsCard = page.locator('.govuk-summary-card').filter({has: page.getByRole('heading', { name: 'Contact details' }),});
  await expect(contactDetailsCard.locator('.govuk-summary-list__row').filter({ has: page.getByText('Phone number', { exact: true }) }).locator('.govuk-summary-list__value')).toHaveText('07700900123');
  await expect(contactDetailsCard.locator('.govuk-summary-list__row').filter({ has: page.getByText('Is it safe to call this client?', { exact: true }) }).locator('.govuk-summary-list__value')).toHaveText('Yes');

  // Assert support needs summary card is visible with no data 
  await assertSummaryCardState(page, { cardId: 'Client support needs', emptyText: 'No support needs', hasData: false, addHref: '/client-details/add/support-need' });
  // Assert third party details summary card is visible with no data
  await assertSummaryCardState(page, { cardId: 'Third party contact', emptyText: 'No third party contact required', hasData: true, changeHref: '/client-details/change/third-party', removeHref: '/confirm/remove-third-party' });
  // Assert the data in the third party details summary card is correct
  await assertSummaryCardData(page, 'Third party contact', { 'Name': 'Sarah Johnson', 'Phone number': 'Warning Not safe to call', 'Email address': 'sarah@johnson.com', 'Address': '45 Main Street, Sheffield S1 2AB', 'Relationship to client': 'Family member or friend', 'Passphrase': 'TestPass123' });
});

test('when safe to call and annouce are false when phone number is valid this is saved and user redirect to client details', async ({ page, i18nSetup }) => {
  const phoneInput = page.locator('#phoneNumber');
  const safeToCallRadios = page.locator('[name="safeToCall"]');
  const announceCallRadios = page.locator('[name="announceCall"]');
  const saveButton = page.getByRole('button', { name: t('common.save') });

  // Navigate to the change phone number form
  await page.goto('/cases/PC-7445-2319/client-details/change/phone-number');

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, { withMenuButtons: false, expectedName: 'Llywelyn AP Parry', expectedCaseRef: 'PC-7445-2319', dateReceived: '9 January 2025', badgeTexts: ['At risk of abuse'], });

  // Fill in valid phone number details
  await phoneInput.fill('07700900123');
  await safeToCallRadios.nth(1).check(); // Select "No" for safe to call
  await announceCallRadios.nth(1).check(); // Select "No" for announce call

  // Submit the form
  await saveButton.click();

  // Should redirect to client details page
  await expect(page).toHaveURL('/cases/PC-7445-2319/client-details');
  const contactDetailsCard = page.locator('.govuk-summary-card').filter({has: page.getByRole('heading', { name: 'Contact details' }),});
  await expect(contactDetailsCard.locator('.govuk-summary-list__row').filter({ has: page.getByText('Phone number', { exact: true }) }).locator('.govuk-summary-list__value')).toHaveText('Number hidden');
  await expect(contactDetailsCard.locator('.govuk-summary-list__row').filter({ has: page.getByText('Is it safe to call this client?', { exact: true }) }).locator('.govuk-summary-list__value')).toHaveText('! Warning No');

  // Assert support needs summary card is visible with no data 
  await assertSummaryCardState(page, { cardId: 'Client support needs', emptyText: 'No support needs', hasData: false, addHref: '/client-details/add/support-need' });
  // Assert third party details summary card is visible with no data
  await assertSummaryCardState(page, { cardId: 'Third party contact', emptyText: 'No third party contact required', hasData: false, addHref: '/client-details/add/third-party' });
});

test('when safe to call is true and annouce is false when phone number is valid this is saved and user redirect to client details', async ({ page, i18nSetup }) => {
  const phoneInput = page.locator('#phoneNumber');
  const safeToCallRadios = page.locator('[name="safeToCall"]');
  const announceCallRadios = page.locator('[name="announceCall"]');
  const saveButton = page.getByRole('button', { name: t('common.save') });

  // Navigate to the change phone number form
  await page.goto('/cases/PC-7755-4557/client-details/change/phone-number');

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, { withMenuButtons: false, expectedName: "Alan Turning", expectedCaseRef: "PC-7755-4557", dateReceived: "9 January 2025", badgeTexts: ['At risk of abuse', 'Third Party'] });

  // Fill in valid phone number details
  await phoneInput.fill('07700900123');
  await safeToCallRadios.first().check(); // Select "Yes" for safe to call
  await announceCallRadios.nth(1).check(); // Select "No" for announce call

  // Submit the form
  await saveButton.click();

  // Should redirect to client details page
  await expect(page).toHaveURL('/cases/PC-7755-4557/client-details');
  const contactDetailsCard = page.locator('.govuk-summary-card').filter({has: page.getByRole('heading', { name: 'Contact details' }),});
  await expect(contactDetailsCard.locator('.govuk-summary-list__row').filter({ has: page.getByText('Phone number', { exact: true }) }).locator('.govuk-summary-list__value')).toHaveText('07700900123');
  await expect(contactDetailsCard.locator('.govuk-summary-list__row').filter({ has: page.getByText('Is it safe to call this client?', { exact: true }) }).locator('.govuk-summary-list__value')).toHaveText('! Warning Do not say the call is from Civil Legal Advice');

  // Assert support needs summary card is visible with no data 
  await assertSummaryCardState(page, { cardId: 'Client support needs', emptyText: 'No support needs', hasData: false, addHref: '/client-details/add/support-need' });
  // Assert third party details summary card is visible with no data
  await assertSummaryCardState(page, { cardId: 'Third party contact', emptyText: 'No third party contact required', hasData: true, changeHref: '/client-details/change/third-party', removeHref: '/confirm/remove-third-party' });
  // Assert the data in the third party details summary card is correct
  await assertSummaryCardData(page, 'Third party contact', { 'Name': 'Joanne Screenhouse', 'Phone number': 'Not provided', 'Email address': 'Joanne@outlook.com', 'Address': '1 Hadamard Gate, Oxford OX1 1AW', 'Relationship to client': 'Other' });
});

test('when safe to call is false and annouce is true when phone number is valid this is saved and user redirect to client details', async ({ page, i18nSetup }) => {
  const phoneInput = page.locator('#phoneNumber');
  const safeToCallRadios = page.locator('[name="safeToCall"]');
  const announceCallRadios = page.locator('[name="announceCall"]');
  const saveButton = page.getByRole('button', { name: t('common.save') });

  // Navigate to the change phone number form
  await page.goto('/cases/PC-1869-9154/client-details/change/phone-number');

  // Assert the case details header is present
  await assertCaseDetailsHeaderPresent(page, { withMenuButtons: false, expectedName: "Grace Baker", expectedCaseRef: "PC-1869-9154", dateReceived: "8 August 2025", badgeTexts: ['At risk of abuse', 'Third Party', 'Translation', 'BSL'] });

  // Fill in valid phone number details
  await phoneInput.fill('07700900123');
  await safeToCallRadios.nth(1).check(); // Select "No" for safe to call
  await announceCallRadios.first().check(); // Select "Yes" for announce call

  // Submit the form
  await saveButton.click();

  // Should redirect to client details page
  await expect(page).toHaveURL('/cases/PC-1869-9154/client-details');
  const contactDetailsCard = page.locator('.govuk-summary-card').filter({has: page.getByRole('heading', { name: 'Contact details' }),});
  await expect(contactDetailsCard.locator('.govuk-summary-list__row').filter({ has: page.getByText('Phone number', { exact: true }) }).locator('.govuk-summary-list__value')).toHaveText('Number hidden');
  await expect(contactDetailsCard.locator('.govuk-summary-list__row').filter({ has: page.getByText('Is it safe to call this client?', { exact: true }) }).locator('.govuk-summary-list__value')).toHaveText('! Warning No');

  // Assert support needs summary card is visible with data 
  await assertSummaryCardState(page, { cardId: 'Client support needs', emptyText: 'No support needs', hasData: true, changeHref: '/client-details/change/support-need' });
  // Assert the data in the support needs summary card is correct
  await assertSummaryCardData(page, 'Client support needs', { 'British Sign Language': 'Yes', 'Language – needs interpreter': 'English', 'Other support': 'Here are some notes from the operator!' });
  // Assert third party details summary card is visible with data
  await assertSummaryCardState(page, { cardId: 'Third party contact', emptyText: 'No third party contact required', hasData: true, changeHref: '/client-details/change/third-party', removeHref: '/confirm/remove-third-party' });
  // Assert the correct data is displayed in the third party data summary card
  await assertSummaryCardData(page, 'Third party contact', { 'Name': 'Samira Patel', 'Phone number': 'Not provided', 'Email address': 'samira@patel.com', 'Address': '84 Zoo Lane, Birmingham B88 1RW', 'Relationship to client': 'Legal adviser' });
});

test('shows warning banner when no changes are made', async ({ page, i18nSetup }) => {
  const saveButton = page.getByRole('button', { name: t('common.save') });

  // Go to edit page
  await page.goto(visitUrl);

  await assertCaseDetailsHeaderPresent(page, { withMenuButtons: false, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 July 2025", badgeTexts: ['Urgent', 'At risk of abuse', 'Third Party'] });

  await saveButton.click();

  await expect(page).toHaveURL(clientDetailsUrl);

  // Assert support needs summary card is visible with no data 
  await assertSummaryCardState(page, { cardId: 'Client support needs', emptyText: 'No support needs', hasData: false, addHref: '/client-details/add/support-need' });
  // Assert third party details summary card is visible with no data
  await assertSummaryCardState(page, { cardId: 'Third party contact', emptyText: 'No third party contact required', hasData: true, changeHref: '/client-details/change/third-party', removeHref: '/confirm/remove-third-party' });
  // Assert the data in the third party details summary card is correct
  await assertSummaryCardData(page, 'Third party contact', { 'Name': 'Sarah Johnson', 'Phone number': 'Warning Not safe to call', 'Email address': 'sarah@johnson.com', 'Address': '45 Main Street, Sheffield S1 2AB', 'Relationship to client': 'Family member or friend', 'Passphrase': 'TestPass123' });

  // Assert warning banner appears
 const warningBanner = page.getByRole('region', { name: 'warning: No changes were made' });
  await expect(warningBanner).toBeVisible();

  // Check warning banner contains correct text
  await expect(warningBanner).toContainText('No changes were made');
});


test('phone number edit page should be accessible', {
  tag: '@accessibility',
}, async ({ page, checkAccessibility }) => {
  await page.goto(visitUrl);
  await checkAccessibility();
});

