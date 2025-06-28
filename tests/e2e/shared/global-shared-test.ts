import { expect, type Page } from '@playwright/test';
// Case page configuration interface
export interface PageConfig {
  path: string;
  tabName: string;
  headingText: string;
  titleSuffix: string;
  tableId: string;
}

// Configuration for all page types
export const PAGE_CONFIGS: Record<string, PageConfig> = {
  new: {
    path: '/cases/new',
    tabName: 'New',
    headingText: 'New cases',
    titleSuffix: 'New Cases',
    tableId: 'new-cases-table'
  },
  opened: {
    path: '/cases/opened',
    tabName: 'Opened',
    headingText: 'Opened cases',
    titleSuffix: 'Opened Cases',
    tableId: 'opened-cases-table'
  },
  accepted: {
    path: '/cases/accepted',
    tabName: 'Accepted',
    headingText: 'Accepted cases',
    titleSuffix: 'Accepted Cases',
    tableId: 'accepted-cases-table'
  },
  closed: {
    path: '/cases/closed',
    tabName: 'Closed',
    headingText: 'Closed cases',
    titleSuffix: 'Closed Cases',
    tableId: 'closed-cases-table'
  }
};

// Constants
const HEADING_LEVEL = 1;
const SINGLE_ACTIVE_TAB_COUNT = 1;

// Common navigation items for cases pages
export const YOUR_CASES_NAV_ITEMS = [
  { text: 'New', href: '/cases/new' },
  { text: 'Opened', href: '/cases/opened' },
  { text: 'Accepted', href: '/cases/accepted' },
  { text: 'Closed', href: '/cases/closed' }
];

/**
 * Shared test function to verify page heading
 * @param {Page} page - Playwright page object
 * @param {PageConfig} config - Page configuration
 */
export async function testPageHeading(page: Page, config: PageConfig): Promise<void> {
  await expect(page.getByRole('heading', { level: HEADING_LEVEL })).toHaveText(config.headingText);
}

/**
 * Shared test function to verify page title
 * @param {Page} page - Playwright page object
 * @param {PageConfig} config - Page configuration
 */
export async function testPageTitle(page: Page, config: PageConfig): Promise<void> {
  const title = await page.title();
  const expectedPattern = new RegExp(`^Your Cases - ${config.titleSuffix} – .+ – GOV\\.UK$`);
  expect(title).toMatch(expectedPattern);
  expect(title).toContain(`Your Cases - ${config.titleSuffix}`);
  expect(title).toContain('GOV.UK');
}

/**
 * Shared test function to verify sub-navigation
 * @param {Page} page - Playwright page object
 * @param {Array<{text: string, href: string}>} expectedItems - Expected navigation items
 */
export async function testSubNavigation(page: Page, expectedItems: Array<{ text: string, href: string }>): Promise<void> {
  const subNav = page.locator('nav.moj-sub-navigation');
  await expect(subNav).toBeVisible();

  const navItems = subNav.locator('a');
  await expect(navItems).toHaveCount(expectedItems.length);

  // Verify each navigation item
  for (let i = 0; i < expectedItems.length; i++) {
    await expect(navItems.nth(i)).toHaveText(expectedItems[i].text);
    await expect(navItems.nth(i)).toHaveAttribute('href', expectedItems[i].href);
  }
}

/**
 * Shared test function to verify active tab
 * @param {Page} page - Playwright page object
 * @param {PageConfig} config - Page configuration
 * @param {Array<{text: string, href: string}>} expectedItems - Expected navigation items
 */
export async function testActiveTab(page: Page, config: PageConfig, expectedItems: Array<{ text: string, href: string }>): Promise<void> {
  const subNav = page.locator('nav.moj-sub-navigation');
  const activeTab = subNav.locator('a[aria-current="page"]');

  // Should have exactly one active tab
  await expect(activeTab).toHaveCount(SINGLE_ACTIVE_TAB_COUNT);

  // The active tab should match the expected tab
  await expect(activeTab).toHaveText(config.tabName);
  await expect(activeTab).toHaveAttribute('href', config.path);

  // Verify other tabs are not active (total items - 1 active tab)
  const inactiveTabs = subNav.locator('a:not([aria-current="page"])');
  const expectedInactiveCount = expectedItems.length - SINGLE_ACTIVE_TAB_COUNT;
  await expect(inactiveTabs).toHaveCount(expectedInactiveCount);
}
