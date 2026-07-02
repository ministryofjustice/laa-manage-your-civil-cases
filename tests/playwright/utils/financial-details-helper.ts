import { expect, Page } from '@playwright/test';

export async function expectTableRows(
  page: Page,
  panelId: string,
  rows: Record<string, string>
) {
  const panel = page.locator(`#${panelId}`);

  for (const [label, value] of Object.entries(rows)) {
    const row = panel.locator('tr').filter({
      has: page.getByText(label, { exact: true })
    });

    await expect(row).toContainText(label);
    await expect(row).toContainText(value);
  }
}

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
