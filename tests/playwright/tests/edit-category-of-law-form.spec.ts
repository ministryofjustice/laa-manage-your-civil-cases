import { test, expect } from '../fixtures/index.js';
import { setupAuth, assertCaseDetailsHeaderPresent, getClientDetailsUrlByStatus, logout } from '../utils/index.js';
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
  await expect(caseDetailsPage.categoryValue)
    .toContainText('Discrimination');

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

  // Assert the page heading is correct
  //await changeCategoryPage.expectPageLoaded(changeCategoryPage.getExpectedHeading());

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