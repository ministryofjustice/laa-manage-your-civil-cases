import { test as base, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import { initI18nSync } from '../helpers/i18n.js';

/**
 * Custom test fixture with i18n setup and accessibility testing
 */
interface TestFixtures {
  i18nSetup: undefined;
  checkAccessibility: () => Promise<void>;
}

export const test = base.extend<TestFixtures>({
  // This fixture runs once per test file to initialize i18n
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
   * @param {object} root0 - Playwright test fixtures object
   * @param {import('@playwright/test').Page} root0.page - Playwright page object for the current test
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
      if (hasViolations) {
        console.log(`Accessibility violations found on ${page.url()}:`, 
          violations.map(v => ({
            id: v.id,
            impact: v.impact,
            description: v.description,
            nodes: v.nodes.length
          }))
        );
      }
      
      expect(violations).toEqual([]);
    };
    await use(checkAccessibility);
  }
});

export { expect } from '@playwright/test';