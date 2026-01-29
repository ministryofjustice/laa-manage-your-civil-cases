import { expect, Locator, Page } from '@playwright/test';

export async function assertCaseDetailsHeaderPresent(page: Page, withMenuButtons: boolean, expectedName: string,
  expectedCaseRef: string, dateReceived: string) {

  const caseHeader = page.locator('.mcc-case-details-header');
  await expect(caseHeader).toBeVisible();

  await assertHeaderItem(caseHeader, 'Date received', dateReceived);
  await assertHeaderItem(caseHeader, expectedName, expectedCaseRef);

  if (withMenuButtons) {
    await assertMenuButtonVisible(page);
  }
}

async function assertMenuButtonVisible(page: Page) {
  const toggle = page.getByRole('button', { name: 'Change status' });
  await expect(toggle).toBeVisible();
}

async function assertHeaderItem(container: Locator,
  headingText: string,
  expectedValue: string) {
  const item = container.getByRole('heading', { level: 2, name: headingText });
  const value = item.locator('xpath=following-sibling::p[contains(@class,"govuk-body")][1]');
  await expect(value).toHaveText(expectedValue);

}