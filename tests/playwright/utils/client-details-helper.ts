import { expect, Page } from '@playwright/test';

type SummaryCardOptions = {
  cardId: string;
  emptyText: string;
  hasData: boolean;
  addHref?: string;
  changeHref?: string;
  removeHref?: string;
};

export async function assertSummaryCardState(
  page: Page,
  {
    cardId,
    emptyText,
    hasData,
    addHref,
    changeHref,
    removeHref
  }: SummaryCardOptions
) {

  const card = page.locator('.govuk-summary-card', {
    has: page.getByRole('heading', { name: cardId })
  });

  // Summary Card is always visible
  await expect(card).toBeVisible();

  // If there is data in the summary card 
  if (hasData) {
    // It Should not show empty text
    await expect(card).not.toContainText(emptyText);

    // The change link should be visible for summary card with data
    if (changeHref) {
      await expect(card.locator(`a[href*="${changeHref}"]`)).toBeVisible();
    }

    // Optional remove link if this is available in the summary card
    if (removeHref) {
      await expect(card.locator(`a[href*="${removeHref}"]`)).toBeVisible();
    }
    // When there is no data in the summary card
  } else {
    // Should show empty text
    await expect(card).toContainText(emptyText);

    // Should show add link
    if (addHref) {
      await expect(card.locator(`a[href*="${addHref}"]`)).toBeVisible();
    }

    // Should not show change/remove
    if (changeHref) {
      await expect(card.locator(`a[href*="${changeHref}"]`)).toHaveCount(0);
    }
    if (removeHref) {
      await expect(card.locator(`a[href*="${removeHref}"]`)).toHaveCount(0);
    }
  }
}

export async function assertSummaryCardData(
  page: Page,
  cardTitle: string,
  expectedData: Record<string, string>
) {
  const card = page.locator('.govuk-summary-card', {
    has: page.getByRole('heading', { name: cardTitle })
  });

  await expect(card).toBeVisible();

  for (const [label, value] of Object.entries(expectedData)) {
    const row = card
      .locator('.govuk-summary-list__row')
      .filter({
        has: page.locator('.govuk-summary-list__key', {
          hasText: new RegExp(`^\\s*${label}\\b`, 'i')
        })
      });

    await expect(row).toHaveCount(1);

    const valueCell = row.locator('.govuk-summary-list__value');

    await expect(valueCell).toBeVisible();
    await expect(valueCell).toContainText(value);
  }
}