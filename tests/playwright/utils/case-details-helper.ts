import { expect, Page } from '@playwright/test';

export async function assertCaseDetailsHeaderPresent(page: Page, withMenuButtons: boolean, expectedName: string,
  expectedCaseRef: string, dateRecieved: string) {

  const caseHeader = page.locator('.mcc-case-details-header');
  await expect(caseHeader).toBeVisible();

  const date = page.locator('[class~="govuk-!-display-inline-block"]').filter({
    has: page.getByRole('heading', { level: 2, name: 'Date received' })
  });
  await expect(date).toBeVisible();
  const dateValue = date.locator('p.govuk-body');
  await expect(dateValue).toBeVisible();
  await expect(dateValue).toHaveText(dateRecieved);

  const name = page.locator('[class~="govuk-!-display-inline-block"]').filter({
    has: page.getByRole('heading', { level: 2, name: expectedName })
  });
  await expect(name).toBeVisible();

  const caseRef = name.locator('p.govuk-body');
  await expect(caseRef).toBeVisible();
  await expect(caseRef).toHaveText(expectedCaseRef);

  if (withMenuButtons) {
    assertMenuButtonVisible(page);
  }
}

async function assertMenuButtonVisible(page: Page) {
  const toggle = page.getByRole('button', { name: 'Change status' });
  await expect(toggle).toBeVisible();
}