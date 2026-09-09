import { expect, Locator, Page } from '@playwright/test';

type ExpectedRowValue = string | string[];

/**
 * Checks that a table contains the expected rows and values
 * @param table table locator to be checked for expected rows
 * @param rows rows within the table to be checked
 */
export async function expectTableRows(
  table: Locator,
  rows: Record<string, ExpectedRowValue>,
) {
  for (const [label, expectedValue] of Object.entries(rows)) {
    const row = table.locator('tr').filter({
      hasText: label,
    });

    await expect(row).toContainText(label);

    const values = Array.isArray(expectedValue)
      ? expectedValue
      : [expectedValue];

    for (const value of values) {
      await expect(row).toContainText(value);
    }
  }
}

/**
 * Checks that a table following a specific heading contains the expected rows and values
 * @param page page to be checked for financial details
 * @param headingText heading text to be checked in financial details section
 * @param rows rows within financial details table to be checked
 */
export async function expectHeadingTableRows(
  page: Page,
  headingText: string,
  rows: Record<string, ExpectedRowValue>,
) {
  const heading = page.getByRole('heading', {
    name: headingText,
  });

  await expect(heading).toBeVisible();

  const table = heading.locator('xpath=following-sibling::table[1]');

  await expectTableRows(table, rows);
}


/**
 * Helper to assert financial details elements, tables and captions
 * @param page page to be checked for financial details
 * @param propertyHeading heading to be checked in financial details section
 * @param rows row within financial details table to be checked
 */
export async function expectPropertyTableRows(
  page: Page,
  propertyHeading: string,
  rows: Record<string, ExpectedRowValue>
) {
  const heading = page.getByRole('heading', {
    name: propertyHeading
  });

  await expect(heading).toBeVisible();

  const table = heading.locator('xpath=following-sibling::table[1]');

  await expectTableRows(table, rows);
}

/**
 * Checks that a table with a specific caption contains the expected rows and values
 * @param page page to be checked for financial details
 * @param captionText caption text to be checked in financial details section
 * @param rows rows within financial details table to be checked
 */
export async function expectCaptionTableRows(
  page: Page,
  captionText: string,
  rows: Record<string, ExpectedRowValue>
) {
  const caption = page.locator('caption').filter({
    hasText: captionText
  });

  await expect(caption).toBeVisible();

  const table = caption.locator('xpath=ancestor::table');

  for (const [label, value] of Object.entries(rows)) {
    const row = table.locator('tr').filter({
      hasText: label
    });

    await expect(row).toContainText(label);
    await expect(row).toContainText(value);
  }
}

