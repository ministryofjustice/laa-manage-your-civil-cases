import { expect, Page } from '@playwright/test';

export async function assertCaseDetailsHeaderPresent(page: Page) {
  await expect(page.locator('[data-testid="case-details-header"]')).toBeVisible();
}
