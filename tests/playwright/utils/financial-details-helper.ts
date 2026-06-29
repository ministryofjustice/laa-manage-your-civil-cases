import { expect, Page } from '@playwright/test';

/**
 * Helper to assert financial details elements, tables and captions. 
 * @param page page to be checked for financial detials
 * @param propertyHeading heading to be checked in financial details section
 * @param rows row within financial details table to be checked
 */
export async function expectPropertyTableRows(
  page: Page,
  propertyHeading: string,
  rows: Record<string, string>
) {
  const heading = page.getByRole('heading', {
    name: propertyHeading
  });

  await expect(heading).toBeVisible();

  const table = heading.locator('xpath=following-sibling::table[1]');

  for (const [label, value] of Object.entries(rows)) {
    const row = table.locator('tr').filter({
      hasText: label
    });

    await expect(row).toContainText(label);
    await expect(row).toContainText(value);
  }
}

/**
 * Checks that a table with a specific caption contains the expected rows and values.
 * @param page page to be checked for financial detials
 * @param captionText caption text to be checked in financial details section
 * @param rows rows within financial details table to be checked
 */
export async function expectCaptionTableRows(
  page: Page,
  captionText: string,
  rows: Record<string, string>
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

