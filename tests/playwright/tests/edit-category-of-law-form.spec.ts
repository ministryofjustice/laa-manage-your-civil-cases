import { test, expect } from '../fixtures/index.js';
import { setupAuth, getClientDetailsUrlByStatus, assertSummaryCardData, logout } from '../utils/index.js';
import { ChangeCategoryOfLawFormPage } from '../pages/ChangeCategoryOfLawFormPage.js';
import { CaseDetailsTabPage } from '../pages/index.js';

const clientDetailsUrl = getClientDetailsUrlByStatus('default');
const caseReference = clientDetailsUrl.split('/')[2]; // Extract case reference from URL

test.beforeEach(async ({ page }) => {
  await setupAuth(page);
});

test.afterEach(async ({ page }) => {
  await logout(page);
})

test('category summary card is displayed and change link directs to change category page', async ({ page }) => {
  const caseDetailsPage = CaseDetailsTabPage.forCase(page, 'PC-2211-4466');

  const changeCategoryOfLawFormUrl = `/cases/PC-2211-4466/change-law-category`;
  await caseDetailsPage.navigate();

  // Category row exists
  await expect(caseDetailsPage.categoryRow).toBeVisible();

  // Current category shown
  await expect(caseDetailsPage.categoryValue).toContainText('Discrimination');

  // Change link shown
  await expect(caseDetailsPage.changeCategoryCardLink).toBeVisible();

  // Navigate to form
  await caseDetailsPage.clickChangeCategory();

  // Assert we have reached the change category of law url
  await expect(page).toHaveURL(changeCategoryOfLawFormUrl);
});

test('when there are two categories assigned to the provider this is displayed correctly', async ({ page }) => {
  const changeCategoryPage = ChangeCategoryOfLawFormPage.forCase(page, 'PC-1922-1879');

  const changeCategoryOfLawFormUrl = `/cases/PC-1922-1879/change-law-category`;

  await changeCategoryPage.navigate();

  // Assert we have reached the change category of law url
  await expect(page).toHaveURL(changeCategoryOfLawFormUrl);

  // Assert the expected text is displayed as one line and not a drop down selection. 
  const container = page.locator('p.govuk-body', { hasText: 'New category of law' });
  await expect(container).toContainText('Debt, money problems and bankruptcy');

  // Assert the notes textarea is visible
  await expect(changeCategoryPage.notesTextarea).toBeVisible();

  // Fill the notes field
  await page.fill('#notes', 'Category changed due to change in case circumstances');

  // Click the submit button
  await page.getByRole('button', { name: 'Save' }).click();

  // Assert POST redirect happened
  await expect(page).toHaveURL(`/cases/${caseReference}/case-details`);

});

test('when there are more than two categories assigned to the provider this is displayed as a dropdown', async ({ page }) => {
  const changeCategoryPage = ChangeCategoryOfLawFormPage.forCase(page, 'PC-1977-1241');

  const changeCategoryOfLawFormUrl = `/cases/PC-1977-1241/change-law-category`;

  await changeCategoryPage.navigate();

  // Assert we have reached the change category of law url
  await expect(page).toHaveURL(changeCategoryOfLawFormUrl);

  // Assert the category select and notes textarea are visible
  await expect(changeCategoryPage.categorySelect).toBeVisible();
  await expect(changeCategoryPage.notesTextarea).toBeVisible();

  // Assert there should be 3 values in the list - the 2 remaining categories and the placeholder "Select a category" option
  const options = await changeCategoryPage.categorySelect.locator('option').all();
  expect(options.length).toBe(3);

  // Select a category from the drop down menu 
  await page.selectOption('#category', { label: 'Debt, money problems and bankruptcy' });

  // Fill the notes field
  await page.fill('#notes', 'Category changed due to change in case circumstances');

  // Click the submit button
  await page.getByRole('button', { name: 'Save' }).click();

  // Assert POST redirect happened
  await expect(page).toHaveURL(`/cases/PC-1977-1241/case-details`);

});

test('we should see error validations, when no data entered', async ({ page, i18nSetup }) => {
  const changeCategoryPage = ChangeCategoryOfLawFormPage.forCase(page, 'PC-1977-1241');

  const changeCategoryOfLawFormUrl = `/cases/PC-1977-1241/change-law-category`;

  await changeCategoryPage.navigate();

  // Assert we have reached the change category of law url
  await expect(page).toHaveURL(changeCategoryOfLawFormUrl);

  // Assert the category select and notes textarea are visible
  await expect(changeCategoryPage.categorySelect).toBeVisible();
  await expect(changeCategoryPage.notesTextarea).toBeVisible();

  // Fill the notes field
  await page.fill('#notes', 'Category changed due to change in case circumstances');

  // Click the submit button without selecting a drop down
  await page.getByRole('button', { name: 'Save' }).click();

  // Assert we have stayed on change category page
  await expect(page).toHaveURL(changeCategoryOfLawFormUrl);

  // Assert error components are visible
  const errorSummaryComponent = page.locator('div').filter({ hasText: 'There is a problem' }).nth(5);
  const inlineErrorCategory = page.getByText('Error: Select a category of law');
  await expect(errorSummaryComponent).toBeVisible();
  await expect(inlineErrorCategory).toBeVisible();
});

test('when there is more than one error all errors validations should be displayed', async ({ page, i18nSetup }) => {
  const changeCategoryPage = ChangeCategoryOfLawFormPage.forCase(page, 'PC-1977-1241');

  const changeCategoryOfLawFormUrl = `/cases/PC-1977-1241/change-law-category`;

  await changeCategoryPage.navigate();

  // Assert we have reached the change category of law url
  await expect(page).toHaveURL(changeCategoryOfLawFormUrl);

  // Assert the category select and notes textarea are visible
  await expect(changeCategoryPage.categorySelect).toBeVisible();
  await expect(changeCategoryPage.notesTextarea).toBeVisible();

  // Click the submit button without selecting a drop down
  await page.getByRole('button', { name: 'Save' }).click();

  // Assert we have stayed on change category page
  await expect(page).toHaveURL(changeCategoryOfLawFormUrl);

  // Assert error components are visible
  const errorSummaryComponent = page.locator('div').filter({ hasText: 'There is a problem' }).nth(5);
  const inlineErrorCategory = page.getByText('Error: Select a category of');
  const inlineErrorNotes = page.getByText('Error: Explain why you changed the');
  await expect(errorSummaryComponent).toBeVisible();
  await expect(inlineErrorCategory).toBeVisible();
  await expect(inlineErrorNotes).toBeVisible();
});

test('we should see error validations, for when 2500 or more character entered', async ({ page, i18nSetup }) => {
  const changeCategoryPage = ChangeCategoryOfLawFormPage.forCase(page, 'PC-1977-1241');

  const changeCategoryOfLawFormUrl = `/cases/PC-1977-1241/change-law-category`;

  await changeCategoryPage.navigate();

  // Assert we have reached the change category of law url
  await expect(page).toHaveURL(changeCategoryOfLawFormUrl);

  // Assert the category select and notes textarea are visible
  await expect(changeCategoryPage.categorySelect).toBeVisible();
  await expect(changeCategoryPage.notesTextarea).toBeVisible();

  // Select a category from the drop down menu
  await page.selectOption('#category', { label: 'Debt, money problems and bankruptcy' });

  // Fill the notes field with over 2500 characters to trigger validation error
  const message = 'Splitting case because the issues differ, please repeat message';
  await page.fill('#notes', message.repeat(50));

  // Click the submit button
  await page.getByRole('button', { name: 'Save' }).click();

  // Assert we have stayed on change category page
  await expect(page).toHaveURL(changeCategoryOfLawFormUrl);

  // Assert error components are visible
  const errorSummaryComponent = page.locator('div').filter({ hasText: 'There is a problem' }).nth(5);
  const inlineErrorTooManyCharacters = page.getByText('Error: Why you changed the');
  await expect(errorSummaryComponent).toBeVisible();
  await expect(inlineErrorTooManyCharacters).toBeVisible();
});

test.describe('resetting disputed financial eligibility after category changes', () => {
  test('moving from housing to debt shows disputed assets added banner', async ({ page }) => {
    const changeCategoryPage = ChangeCategoryOfLawFormPage.forCase(page, 'PC-1922-2066');

    const changeCategoryOfLawFormUrl = `/cases/PC-1922-2066/change-law-category`;

    await changeCategoryPage.navigate();

    // Assert we have reached the change category of law url
    await expect(page).toHaveURL(changeCategoryOfLawFormUrl);

    // Assert the category select and notes textarea are visible
    await expect(changeCategoryPage.categorySelect).toBeVisible();
    await expect(changeCategoryPage.notesTextarea).toBeVisible();

    // Assert there should be 3 values in the list - the 2 remaining categories and the placeholder "Select a category" option
    const options = await changeCategoryPage.categorySelect.locator('option').all();
    expect(options.length).toBe(3);

    // Select a category from the drop down menu 
    await page.selectOption('#category', { label: 'Debt, money problems and bankruptcy' });

    // Fill the notes field
    await page.fill('#notes', 'Category changed due to change in case circumstances');

    // Click the submit button
    await page.getByRole('button', { name: 'Save' }).click();

    // Assert POST redirect happened
    await expect(page).toHaveURL(`/cases/PC-1922-2066/case-details`);

    await expect(page.getByText('Disputed asset information may now be relevant.')).toBeVisible();

    // Assert FE call to action is shown
    await expect(page.getByText('Check financial eligibility.')).toBeVisible();

    // Assert the link exists
    const checkFeLink = page.locator('.moj-alert a[href*="financial-eligibility"]').first();
    await expect(checkFeLink).toBeVisible();

    await expect(checkFeLink).toHaveAttribute('href', '/cases/PC-1922-2066/financial-eligibility/');

    // Click the link
    await checkFeLink.click();

    // Assert navigation to FE journey
    await expect(page).toHaveURL('/cases/PC-1922-2066/financial-eligibility/');
  });

  test('moving from debt to housing shows disputed assets remove banner', async ({ page }) => {
    const changeCategoryPage = ChangeCategoryOfLawFormPage.forCase(page, 'PC-8811-9943');

    const changeCategoryOfLawFormUrl = `/cases/PC-8811-9943/change-law-category`;

    await changeCategoryPage.navigate();

    // Assert we have reached the change category of law url
    await expect(page).toHaveURL(changeCategoryOfLawFormUrl);

    // Assert the category select and notes textarea are visible
    await expect(changeCategoryPage.categorySelect).toBeVisible();
    await expect(changeCategoryPage.notesTextarea).toBeVisible();

    // Assert there should be 3 values in the list - the 2 remaining categories and the placeholder "Select a category" option
    const options = await changeCategoryPage.categorySelect.locator('option').all();
    expect(options.length).toBe(3);

    // Select a category from the drop down menu 
    await page.selectOption('#category', { label: 'Housing, eviction and homelessness' });

    // Fill the notes field
    await page.fill('#notes', 'Category changed due to change in case circumstances');

    // Click the submit button
    await page.getByRole('button', { name: 'Save' }).click();

    // Assert POST redirect happened
    await expect(page).toHaveURL(`/cases/PC-8811-9943/case-details`);

    await expect(page.getByText('Disputed asset information no longer applies and has been removed')).toBeVisible();
  });

  test('moving from housing to discrimination shows no disputed assets banner', async ({ page }) => {
    const changeCategoryPage = ChangeCategoryOfLawFormPage.forCase(page, 'PC-7723-5518');

    const changeCategoryOfLawFormUrl = `/cases/PC-7723-5518/change-law-category`;

    await changeCategoryPage.navigate();

    // Assert we have reached the change category of law url
    await expect(page).toHaveURL(changeCategoryOfLawFormUrl);

    // Assert the category select and notes textarea are visible
    await expect(changeCategoryPage.categorySelect).toBeVisible();
    await expect(changeCategoryPage.notesTextarea).toBeVisible();

    // Assert there should be 3 values in the list - the 2 remaining categories and the placeholder "Select a category" option
    const options = await changeCategoryPage.categorySelect.locator('option').all();
    expect(options.length).toBe(3);

    // Select a category from the drop down menu 
    await page.selectOption('#category', { label: 'Discrimination, disability and other issues' });

    // Fill the notes field
    await page.fill('#notes', 'Category changed due to change in case circumstances');

    // Click the submit button
    await page.getByRole('button', { name: 'Save' }).click();

    // Assert POST redirect happened
    await expect(page).toHaveURL(`/cases/PC-7723-5518/case-details`);

    await expect(page.getByText('Disputed asset information no longer applies and has been removed')).not.toBeVisible();
    await expect(page.getByText('Disputed asset information may now be relevant.')).not.toBeVisible();
  });

  test('moving from debt to housing resets disputed assets', async ({ page }) => {
    // As we dont show disputed assets in housing the category will be changed to
    // housing and then back to debt to show the reset values. 
    const changeCategoryPage = ChangeCategoryOfLawFormPage.forCase(page, 'PC-7219-3726');

    // Case has disputed savings details and disputed property set to true
    const changeCategoryOfLawFormUrl = `/cases/PC-7219-3726/change-law-category`;

    await changeCategoryPage.navigate();

    // Assert we have reached the change category of law url
    await expect(page).toHaveURL(changeCategoryOfLawFormUrl);

    // Assert the category select and notes textarea are visible
    await expect(changeCategoryPage.categorySelect).toBeVisible();
    await expect(changeCategoryPage.notesTextarea).toBeVisible();

    // Assert there should be 3 values in the list - the 2 remaining categories and the placeholder "Select a category" option
    const options = await changeCategoryPage.categorySelect.locator('option').all();
    expect(options.length).toBe(3);

    // Select a category from the drop down menu 
    await page.selectOption('#category', { label: 'Housing, eviction and homelessness' });

    // Fill the notes field
    await page.fill('#notes', 'Category changed due to change in case circumstances');

    // Click the submit button
    await page.getByRole('button', { name: 'Save' }).click();

    // Assert POST redirect happened
    await expect(page).toHaveURL(`/cases/PC-7219-3726/case-details`);

    await expect(page.getByText('Disputed asset information no longer applies and has been removed')).toBeVisible();

    // Change back to debt 

    await changeCategoryPage.navigate();

    // Assert we have reached the change category of law url
    await expect(page).toHaveURL(changeCategoryOfLawFormUrl);

    // Assert the category select and notes textarea are visible
    await expect(changeCategoryPage.categorySelect).toBeVisible();
    await expect(changeCategoryPage.notesTextarea).toBeVisible();

    // Select a category from the drop down menu 
    await page.selectOption('#category', { label: 'Debt, money problems and bankruptcy' });

    // Fill the notes field
    await page.fill('#notes', 'Category changed due to change in case circumstances');

    // Click the submit button
    await page.getByRole('button', { name: 'Save' }).click();

    // Assert POST redirect happened
    await expect(page).toHaveURL(`/cases/PC-7219-3726/case-details`);

    await expect(page.getByText('Disputed asset information may now be relevant.')).toBeVisible();

    // Assert FE call to action is shown
    await expect(page.getByText('Check financial eligibility.')).toBeVisible();

    // Assert the link exists
    const checkFeLink = page.locator('.moj-alert a[href*="financial-eligibility"]').first();
    await expect(checkFeLink).toBeVisible();

    await expect(checkFeLink).toHaveAttribute('href', '/cases/PC-7219-3726/financial-eligibility/');

    // Click the link
    await checkFeLink.click();

    // Assert navigation to FE journey
    await expect(page).toHaveURL('/cases/PC-7219-3726/financial-eligibility/');

    // click the finances section
    await page.getByRole('tab', { name: 'Finances' }).click();

    // Assert the correct data is displayed in the your disputed savings table.
    await assertSummaryCardData(page, 'Your disputed savings', {
      'How much was in your bank account/building society before your last payment went in\\\?': 'Not provided',
      'Do you have any investments, shares or ISAs\\\?': 'Not provided',
      'Do you have any valuable items worth over £500 each\\\?': 'Not provided',
      'Do you have any money owed to you\\\?': 'Not provided'
    });

    // Assert the correct data is displayed in the properties table for one property.
    await assertSummaryCardData(page, '1st property', {
      'What is the current market value of the property\\\?': '£150,000',
      'How much is left to pay on the mortgage\\\?': '£60,000',
      'Is the property disputed\\\?': 'No',
      'Is this your main property\\\?': 'Yes',
      'What percentage of the property do you and/or your partner own\\\?': '100%'
    });

    // Assert the correct data is displayed in the properties table for one property.
    await assertSummaryCardData(page, '2nd property', {
      'What is the current market value of the property\\\?': '£130,000',
      'How much is left to pay on the mortgage\\\?': '£20,000',
      'Is the property disputed\\\?': 'No',
      'Is this your main property\\\?': 'No',
      'What percentage of the property do you and/or your partner own\\\?': '100%'
    });
  });
});