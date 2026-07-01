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