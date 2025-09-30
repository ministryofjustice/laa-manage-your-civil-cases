import { Page } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

/**
 * Accessibility testing helper using axe-core with WCAG 2.2 Level A standards
 */
export class AccessibilityHelper {
  constructor(private page: Page) {}

  /**
   * Performs accessibility scan on the current page
   * @returns Promise<AxeResults> The axe scan results
   */
  async scan() {
    return new AxeBuilder({ page: this.page })
      .withTags(['wcag22a'])
      .analyze();
  }

  /**
   * Checks if the current page has accessibility violations
   * @returns Promise<boolean> True if violations exist, false otherwise
   */
  async hasViolations(): Promise<boolean> {
    const results = await this.scan();
    return results.violations.length > 0;
  }

  /**
   * Gets all accessibility violations for the current page
   * @returns Promise<Array> Array of violation objects
   */
  async getViolations() {
    const results = await this.scan();
    return results.violations;
  }

  /**
   * Performs accessibility check and throws if violations are found
   * @throws {Error} If accessibility violations are detected
   */
  async assertNoViolations(): Promise<void> {
    const violations = await this.getViolations();
    if (violations.length > 0) {
      const violationSummary = violations.map(v => 
        `${v.id}: ${v.description} (${v.nodes.length} instances)`
      ).join('\n');
      
      throw new Error(`Accessibility violations found:\n${violationSummary}`);
    }
  }
}

/**
 * Factory function to create AccessibilityHelper instance
 * @param page Playwright page object
 * @returns AccessibilityHelper instance
 */
export function createAccessibilityHelper(page: Page): AccessibilityHelper {
  return new AccessibilityHelper(page);
}