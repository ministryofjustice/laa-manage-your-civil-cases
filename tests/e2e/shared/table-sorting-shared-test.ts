import { expect, type Page } from '@playwright/test';
import {
  extractDateValues,
  isAscendingSorted,
  isDescendingSorted
} from '../helpers/sorting-helpers.js';
import type { PageConfig } from './global-shared-test.js';


// Constants
const ZERO_LENGTH = 0;
/**
 * Shared test function to verify basic sorting functionality
 * Tests that data is sorted in descending order by default (newest first)
 * @param {Page} page - Playwright page object
 * @param {PageConfig} [config] - Page configuration (optional for backward compatibility)
 */
export async function testDefaultSorting(page: Page, config?: PageConfig): Promise<void> {
  // Extract the date values from the table
  const tableId = config?.tableId;
  const dates = await extractDateValues(page, undefined, tableId);

  // Only test if we have data
  if (dates.length === ZERO_LENGTH) {
    console.log('No data available for sorting test');
    return;
  }

  // Verify dates are sorted in descending order by default
  expect(isDescendingSorted(dates)).toBe(true);
}

/**
 * Shared test function to verify comprehensive sorting
 * @param {Page} page - Playwright page object
 * @param {PageConfig} config - Page configuration
 */
export async function testDateSorting(page: Page, config: PageConfig): Promise<void> {
  /**
   * Helper to extract date values and assert sort order
   * @param {(dates: string[]) => boolean} checkFn - Function to check if dates are sorted
   * @returns {Promise<void>} Promise that resolves when assertion is complete
   */
  const assertSorted = async (checkFn: (dates: string[]) => boolean): Promise<void> => {
    const dates = await extractDateValues(page, undefined, config.tableId);
    expect(dates.length).toBeGreaterThan(ZERO_LENGTH);
    expect(checkFn(dates)).toBe(true);
  };

  // Initial check for data
  const initialDates = await extractDateValues(page, undefined, config.tableId);
  if (initialDates.length === ZERO_LENGTH) {
    console.log('No data available for comprehensive sorting test');
    return;
  }

  // Verify default descending sort
  expect(isDescendingSorted(initialDates)).toBe(true);

  // Find the sortable date column
  const tableLocator = page.locator(`table#${config.tableId}.govuk-table`);
  const dateColumnHeader = tableLocator.locator('thead th a');
  const sortLink = dateColumnHeader.first();

  // Click to ascending sort
  await sortLink.click();
  await page.waitForURL(`**${config.path}?sort=asc`);
  await assertSorted(isAscendingSorted);

  // Click to descending sort again
  await sortLink.click();
  await page.waitForURL(`**${config.path}?sort=desc`);
  await assertSorted(isDescendingSorted);
}
