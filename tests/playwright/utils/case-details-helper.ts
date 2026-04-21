import { expect, Locator, Page } from '@playwright/test';

type CaseDetailsHeaderOptions = {
  withMenuButtons?: boolean;
  expectedName: string;
  expectedCaseRef: string;
  dateReceived: string;
  badgeTexts?: string[];
};

export async function assertCaseDetailsHeaderPresent(
  page: Page,
  {
    withMenuButtons = false,
    expectedName,
    expectedCaseRef,
    dateReceived,
    badgeTexts,
  }: CaseDetailsHeaderOptions
) {
  const caseHeader = page.locator('#mcc-case-details-header');
  await expect(caseHeader).toBeVisible();

  await assertCaptionItem(caseHeader, expectedCaseRef);
  await assertH1Item(caseHeader, expectedName);
  await assertH2Item(caseHeader, 'Date received', dateReceived);

  if (badgeTexts && badgeTexts.length > 0) {
    await assertCaseFlagsBadgesToBeVisible(caseHeader, badgeTexts);
  }

  if (withMenuButtons) {
    await assertMenuButtonVisible(caseHeader);
  }
}

async function assertCaseFlagsBadgesToBeVisible(container: Locator,badgeTexts: string[]) {
  for (const badgeText of badgeTexts) {
    const badge = container.locator('.moj-badge').filter({ hasText: badgeText });
    await expect(badge).toBeVisible();
  }
}

async function assertMenuButtonVisible(container: Locator) {
  const toggle = container.getByRole('button', { name: 'Change status' });
  await expect(toggle).toBeVisible();
}

async function assertCaptionItem(container: Locator, expectedValue: string) {
  const caption = container.locator('p.govuk-caption-l');
  await expect(caption).toHaveText(expectedValue);
}

async function assertH1Item(container: Locator, expectedValue: string) {
  const headingName = container.getByRole('heading', { level: 1 });
  await expect(headingName).toHaveText(expectedValue);
}

async function assertH2Item(container: Locator, headingText: string, expectedValue: string) {
  const heading = container.locator('h2', { hasText: headingText });
  const value = heading.locator('.govuk-body');
  await expect(value).toHaveText(expectedValue);
}