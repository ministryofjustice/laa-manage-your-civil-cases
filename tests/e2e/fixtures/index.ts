import { test as base } from '@playwright/test';
import { initI18nSync } from '../helpers/i18n.js';

/**
 * Custom test fixture with i18n setup
 */
interface TestFixtures {
  i18nSetup: undefined;
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
  }, { scope: 'test' }]
});

export { expect } from '@playwright/test';