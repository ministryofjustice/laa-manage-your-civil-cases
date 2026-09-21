import { test, expect } from '../fixtures/index.js';
import { setupAuth, assertCaseDetailsHeaderPresent, assertSummaryCardData, assertSummaryCardState } from '../utils/index.js';

const caseReference = 'PC-1922-1879';
const formUrl = `/cases/${caseReference}/client-details/change/national-insurance-number`;
const clientDetailsUrl = `/cases/${caseReference}/client-details`;

test.describe('Edit Client National Insurance number', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test('viewing change National Insurance number form should display expected elements', async ({ page }) => {
    // Arrange & Act
    await page.goto(formUrl);

    // Assert the case details header is present
    await assertCaseDetailsHeaderPresent(page, { withMenuButtons: false, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 Jul 2025 at", badgeTexts: ['Urgent', 'At risk of abuse', 'Third Party'], dateOfBirth: "18 Aug 1981 (45)" });
    
    // Assert page elements are present 
    await expect(page.locator('label[for="nationalInsuranceNumber"]')).toHaveText('Client National Insurance number (optional)');
    await expect(page.locator('#nationalInsuranceNumber')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
  });

  // Arrange
  const invalidNationalInsuranceNumbers = [
    'BG123456A', // excluded prefix
    'GB123456A', // excluded prefix
    'QQ123456E', // invalid suffix
    'IQ123456C', // invalid first prefix letter
  ];

  for (const nationalInsuranceNumber of invalidNationalInsuranceNumbers) {
    test(`rejects invalid National Insurance number "${nationalInsuranceNumber}"`, async ({ page }) => {
      // Arrange 
      await page.goto(formUrl);

      // Act
      await page.locator('#nationalInsuranceNumber').fill(nationalInsuranceNumber);
      await page.getByRole('button', { name: 'Save' }).click();

      // Assert
      await expect(page).toHaveURL(formUrl);
      await expect(page.locator('.govuk-error-summary')).toBeVisible();
      await expect(page.locator('#nationalInsuranceNumber-error')).toContainText('Enter a National Insurance number in the correct format, for example QQ 12 34 56 C');
    });
  }

  test('allows the National Insurance number to be empty', async ({ page }) => {
    // Arrange 
    await page.goto(formUrl);

    // Assert the case details header is present
    await assertCaseDetailsHeaderPresent(page, { withMenuButtons: false, expectedName: "Jack Youngs", expectedCaseRef: "PC-1922-1879", dateReceived: "7 Jul 2025 at", badgeTexts: ['Urgent', 'At risk of abuse', 'Third Party'], dateOfBirth: "18 Aug 1981 (45)" });

    // Act
    await page.locator('#nationalInsuranceNumber').fill('');
    await page.getByRole('button', { name: 'Save' }).click();

   // Assert
    await expect(page).toHaveURL(clientDetailsUrl);
  });


  test('cancel returns to client details', async ({ page }) => {
    // Arrange 
    await page.goto(formUrl);

    // Act
    await page.getByRole('link', { name: 'Cancel' }).click();

    // Assert
    await expect(page).toHaveURL(clientDetailsUrl);
  });

  test('is accessible', { tag: '@accessibility' }, async ({ page, checkAccessibility }) => {
    await page.goto(formUrl);
    await checkAccessibility();
  });
});