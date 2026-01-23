import { expect, Page } from '@playwright/test';

export async function assertCaseDetailsHeaderPresent(page: Page, withoutMenuButtons: boolean) {
  await expect(page.locator('.mcc-case-details-header')).toBeVisible();
}
