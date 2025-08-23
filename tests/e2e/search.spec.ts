import { test, expect } from './fixtures/index.js';
import { t } from './helpers/index.js';

const visitUrl = '/search';
test('search page should have rendered correctly', async ({ page, i18nSetup }) => {
  // Navigate to the search page
  await page.goto(visitUrl);

  // Check the search is active in the navigation
  const navSearchLink = page.getByRole('link', { name: t('navigation.mainNav.search') });
  await expect(navSearchLink).toHaveAttribute('href', visitUrl);
  await expect(navSearchLink).toHaveAttribute('aria-current', 'true');

  // Check for the heading of the search page
  await expect(page.getByRole('heading', { name: t('pages.search.heading') })).toBeVisible();

  // check for the search input
  const searchInput = page.locator('#searchKeyword');
  await expect(searchInput).toBeVisible();
  await expect(searchInput).toHaveValue('');

  // Check for the status filter
  const statusFilter = page.getByLabel(t('pages.search.statusLabel'));
  await expect(statusFilter).toBeVisible();
  await expect(statusFilter).toHaveValue('all');

  // Check for the search button
  const searchButton = page.getByRole('button', { name: t('pages.search.searchButtonText') });
  await expect(searchButton).toBeVisible();

  // Check for the clear button
  const clearButton = page.getByRole('link', { name: t('pages.search.clearLink') });
  await expect(clearButton).toBeVisible();

});

test('if no keyword is entered error message shows', async ({ page, i18nSetup }) => {
  // Navigate to the search page
  await page.goto(visitUrl);

  // Click the search button
  const searchButton = page.getByRole('button', { name: t('pages.search.searchButtonText') });
  await searchButton.click();

  // Check for the error summary
  const errorSummary = page.locator('.govuk-error-summary');
  await expect(errorSummary).toBeVisible();

  // Check for the specific error message in the summary
  const errorSummaryLink = page.locator('.govuk-error-summary a[href="#searchKeyword"]');
  await expect(errorSummaryLink).toBeVisible();
  await expect(errorSummaryLink).toHaveText(t('forms.search.validationError.notEmpty'));

  // Check for the field error message
  const fieldErrorMessage = page.locator('#searchKeyword-error');
  await expect(fieldErrorMessage).toBeVisible();
  await expect(fieldErrorMessage).toContainText(t('forms.search.validationError.notEmpty'));
});


test('if clear button clicked page should refresh', async ({ page, i18nSetup }) => {
  // Navigate to the search page
  await page.goto(visitUrl);

  // Click the clear button
  const clearButton = page.getByRole('link', { name: t('pages.search.clearLink') });
  await clearButton.click();

  // Check that the page has refreshed
  await expect(page).toHaveURL(visitUrl);
});