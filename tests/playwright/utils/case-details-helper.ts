import { expect, Page } from '@playwright/test';

export async function assertCaseDetailsHeaderPresent(page: Page, withMenuButtons: boolean) {
  const caseHeader = page.locator('.mcc-case-details-header');
  await expect(caseHeader).toBeVisible();
  if (withMenuButtons) {
    assertMenuButtonVisible(page);
  }
}

async function assertMenuButtonVisible(page: Page) {
  const toggle = page.getByRole('button', { name: 'Change status' });
  await expect(toggle).toBeVisible();
}