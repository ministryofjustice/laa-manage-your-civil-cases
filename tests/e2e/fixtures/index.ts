import { test as base, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import { initI18nSync } from '../helpers/i18n.js';
import { PageFactory } from '../pages/PageFactory.js';

/**
 * Custom test fixture with i18n setup, accessibility testing, and page objects
 */
interface TestFixtures {
  i18nSetup: undefined;
  checkAccessibility: () => Promise<void>;
  pages: PageFactory;
}

export const test = base.extend<TestFixtures>({
  // This fixture runs once per test file to initialize i18n
  /**
   * Fixture that initializes i18next for each test
   * @param {object} param0 - Fixture parameters
   * @param {import('@playwright/test').Page} param0.page - The Playwright page instance (unused but required)
   * @param {Function} use - The fixture use function
   * @returns {Promise<void>} Promise that resolves when i18n is initialized
   */
  i18nSetup: [async ({ page: _page }, use) => {
    try {
      initI18nSync();
      console.log('✅ i18next initialized for worker');
    } catch (error) {
      console.error('❌ Failed to initialize i18next:', error);
      throw error;
    }
    await use(undefined);
  }, { scope: 'test' }],

  // Thin accessibility testing fixture
  /**
   * Fixture that provides accessibility testing functionality using axe-core
   * @param {object} param0 - Playwright test fixtures object
   * @param {import('@playwright/test').Page} param0.page - Playwright page object for the current test
   * @param {Function} use - Playwright fixture use function to provide the checkAccessibility function
   * @returns {Promise<void>} Promise that resolves when the fixture is ready
   */
  checkAccessibility: async ({ page }, use): Promise<void> => {
    /**
     * Function that performs accessibility scanning on the current page
     * @returns {Promise<void>} Promise that resolves when accessibility scan is complete
     */
    const checkAccessibility = async (): Promise<void> => {
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();

      const { violations } = accessibilityScanResults;
      const noViolations = 0;
      const hasViolations = violations.length > noViolations;
      
      expect(violations).toEqual([]);
    };
    await use(checkAccessibility);
  },

  // Page objects fixture
  /**
   * Provides a PageFactory instance for creating page objects
   * @param {object} param0 - Fixture parameters
   * @param {import('@playwright/test').Page} param0.page - The Playwright page instance
   * @param {Function} use - The fixture use function
   * @returns {Promise<void>} Promise that resolves when the fixture is setup
   */
  pages: async ({ page }, use) => {
    await use(new PageFactory(page));
  }
});

export { expect } from '@playwright/test';