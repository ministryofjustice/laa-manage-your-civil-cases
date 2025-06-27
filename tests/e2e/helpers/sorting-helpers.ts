import type { Page, Locator } from '@playwright/test';

// Constants
const EMPTY_ROW_COUNT = 0;
const DATE_PARTS_COUNT = 3;
const PARSE_INT_BASE = 10;
const ZERO_LENGTH = 0;
const COLUMN_INDEX_OFFSET = 1;
const DEFAULT_DATE_COLUMN = 5;
const SINGLE_ITEM_LENGTH = 1;
const NOT_FOUND_INDEX = -1;
const FIRST_INDEX = 1;

// Month abbreviations array (indices correspond to Date constructor month values 0-11)
const MONTH_ABBREVIATIONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

// Pre-computed month mapping for O(1) lookup
const MONTH_MAP = new Map<string, number>(
  MONTH_ABBREVIATIONS.map((month, index) => [month, index])
);

// Pre-defined date patterns for column detection
const DATE_PATTERNS = ['Date Received', 'Date Modified', 'Date Closed', 'Date modified', 'Date closed'] as const;

/**
 * Find a specific table by ID or the first visible table with data
 * @param {Page} page - Playwright page object
 * @param {string} [tableId] - Optional specific table ID to target
 * @returns {Promise<Locator | null>} The target table or null if none found
 */
async function findVisibleTableWithData(page: Page, tableId?: string): Promise<Locator | null> {
  if (typeof tableId === 'string' && tableId.trim().length > ZERO_LENGTH) {
    const specificTable = page.locator(`table#${tableId}.govuk-table`);
    const [count, isVisible] = await Promise.all([
      specificTable.count(),
      specificTable.isVisible()
    ]);
    if (count > EMPTY_ROW_COUNT && isVisible) {
      const rowCount = await specificTable.locator('tbody tr').count();
      if (rowCount > EMPTY_ROW_COUNT) {
        return specificTable;
      }
    }
    return null;
  }

  // Fallback to finding any visible table with data
  const tables = await page.locator('table.govuk-table').all();

  // Fetch visibility and row counts in parallel
  const tableChecks = await Promise.all(
    tables.map(async table => {
      const [isVisible, rowCount] = await Promise.all([
        table.isVisible(),
        table.locator('tbody tr').count()
      ]);
      return isVisible && rowCount > EMPTY_ROW_COUNT;
    })
  );

  const foundIndex = tableChecks.findIndex(Boolean);
  return foundIndex !== NOT_FOUND_INDEX ? tables[foundIndex] : null;
}

/**
 * Find the column index for a date column by header text
 * @param {Locator[]} headers - Array of header elements
 * @param {string} dateColumnText - Text to search for in headers
 * @returns {Promise<number>} Column index (1-based) or default
 */
async function findDateColumnIndex(headers: Locator[], dateColumnText: string): Promise<number> {
  const headerTexts = await Promise.all(headers.map(async header => await header.textContent()));
  const foundIndex = headerTexts.findIndex(
    text => typeof text === 'string' && text.includes(dateColumnText)
  );
  return foundIndex !== NOT_FOUND_INDEX ? foundIndex + COLUMN_INDEX_OFFSET : DEFAULT_DATE_COLUMN;
}

/**
 * Auto-detect sortable date column index
 * @param {Locator[]} headers - Array of header elements
 * @returns {Promise<number>} Column index (1-based) or default
 */
async function autoDetectDateColumn(headers: Locator[]): Promise<number> {
  const headerTexts = await Promise.all(headers.map(async header => await header.textContent()));
  const foundIndex = headerTexts.findIndex(
    text => typeof text === 'string' && DATE_PATTERNS.some(pattern => text.includes(pattern))
  );
  return foundIndex !== NOT_FOUND_INDEX ? foundIndex + COLUMN_INDEX_OFFSET : DEFAULT_DATE_COLUMN;
}

/**
 * Wait for the appropriate table selector
 * @param {Page} page - Playwright page object
 * @param {string} [tableId] - Optional table ID
 */
async function waitForTableSelector(page: Page, tableId?: string): Promise<void> {
  const selector = (typeof tableId === 'string' && tableId.trim().length > ZERO_LENGTH)
    ? `table#${tableId}.govuk-table`
    : 'table.govuk-table';
  await page.waitForSelector(selector, { state: 'visible' });
}

/**
 * Extract date values from a sortable date column
 * @param {Page} page - Playwright page object
 * @param {string} [dateColumnText] - Text content of the date column header (optional)
 * @param {string} [tableId] - Specific table ID to target (optional)
 * @returns {Promise<string[]>} Array of date strings from the specified date column
 */
export async function extractDateValues(page: Page, dateColumnText?: string, tableId?: string): Promise<string[]> {
  // Wait for any table to be visible first
  await waitForTableSelector(page, tableId);

  // Find the correct table - look for one that's currently displayed and has data
  const targetTable = await findVisibleTableWithData(page, tableId);

  if (targetTable === null) {
    throw new Error(`No visible table with data found${tableId !== undefined ? ` for table ID: ${tableId}` : ''}`);
  }

  // Determine which date column to use
  const headers = await targetTable.locator('thead th').all();
  const columnIndex = (dateColumnText !== undefined && dateColumnText.length > ZERO_LENGTH)
    ? await findDateColumnIndex(headers, dateColumnText)
    : await autoDetectDateColumn(headers);

  // Extract all date values from the determined column using Promise.all for better performance
  const columnSelector = `tbody tr td:nth-child(${columnIndex})`;
  const dateElements = await targetTable.locator(columnSelector).all();

  // Use Promise.all to parallelize text extraction
  const textPromises = dateElements.map(async element => await element.textContent());
  const textValues = await Promise.all(textPromises);

  // Filter and process dates in a single pass
  return textValues
    .map(text => text?.trim())
    .filter((text): text is string => text !== undefined && text.length > ZERO_LENGTH);
}

/**
 * Helper function to convert formatted date string to Date object for comparison
 * @param {string} dateStr - Formatted date string like "08 Jan 2025"
 * @returns {Date} Date object
 */
export function parseFormattedDate(dateStr: string): Date {
  if (typeof dateStr !== 'string' || dateStr.trim() === '') {
    throw new Error(`Empty date string: ${dateStr}`);
  }

  // Expect format: "08 Jan 2025"
  const [dayStr, monthStr, yearStr] = dateStr.trim().split(' ');

  if ([dayStr, monthStr, yearStr].length !== DATE_PARTS_COUNT) {
    throw new Error(`Invalid date format: ${dateStr}`);
  }

  const day = parseInt(dayStr, PARSE_INT_BASE);
  const year = parseInt(yearStr, PARSE_INT_BASE);
  const month = MONTH_MAP.get(monthStr);

  if (month === undefined) {
    throw new Error(`Invalid month: ${monthStr} in date: ${dateStr}`);
  }
  if (Number.isNaN(day) || Number.isNaN(year)) {
    throw new Error(`Invalid day or year in date: ${dateStr}`);
  }

  return new Date(year, month, day);
}

/**
 * Generic function to check if dates are sorted in a specific order
 * @param {string[]} dates - Array of formatted date strings
 * @param {boolean} isAscending - True for ascending, false for descending
 * @returns {boolean} True if sorted in specified order, false otherwise
 */
function isSortedGeneric(dates: string[], isAscending: boolean): boolean {
  if (dates.length <= SINGLE_ITEM_LENGTH) {
    return true;
  }

  const parsedDates = dates.map(parseFormattedDate);

  return parsedDates.slice(FIRST_INDEX).every((date, i) =>
    isAscending
      ? parsedDates[i] <= date
      : parsedDates[i] >= date
  );
}

/**
 * Helper function to verify dates are sorted in ascending order
 * @param {string[]} dates - Array of formatted date strings
 * @returns {boolean} True if sorted ascending, false otherwise
 */
export function isAscendingSorted(dates: string[]): boolean {
  return isSortedGeneric(dates, true);
}

/**
 * Helper function to verify dates are sorted in descending order
 * @param {string[]} dates - Array of formatted date strings
 * @returns {boolean} True if sorted descending, false otherwise
 */
export function isDescendingSorted(dates: string[]): boolean {
  return isSortedGeneric(dates, false);
}
