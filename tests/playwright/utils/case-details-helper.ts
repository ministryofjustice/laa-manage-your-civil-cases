import { expect, Locator, Page } from '@playwright/test';

type CaseDetailsHeaderOptions = {
  withMenuButtons?: boolean;
  isUrgent?: boolean;
  expectedName: string;
  expectedCaseRef: string;
  dateReceived: string;
  urgentBadgeText?: string;
};

export async function assertCaseDetailsHeaderPresent(
  page: Page,
  {
    withMenuButtons = false,
    isUrgent = false,
    expectedName,
    expectedCaseRef,
    dateReceived,
    urgentBadgeText = 'Urgent',
  }: CaseDetailsHeaderOptions
) {
  const caseHeader = page.locator('#mcc-case-details-header');
  await expect(caseHeader).toBeVisible();

  await assertCaptionItem(caseHeader, expectedCaseRef);
  await assertH1Item(caseHeader, expectedName);
  await assertH2Item(caseHeader, 'Date received', dateReceived);

  if (isUrgent) {
    await assertIsUrgentBadgeToBeVisible(caseHeader, urgentBadgeText);
  }

  if (withMenuButtons) {
    await assertMenuButtonVisible(caseHeader);
  }
}

async function assertIsUrgentBadgeToBeVisible(container: Locator, badgeText: string) {
  const urgentBadge = container.locator('.moj-badge', { hasText: badgeText });
  await expect(urgentBadge).toBeVisible();
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