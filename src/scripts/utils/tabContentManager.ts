/**
 * Generic Server-Side Tab Content Manager
 *
 * A reusable utility for handling tab content visibility based on data attributes.
 * Works with any page that uses the pattern:
 * <div data-active-tab="tabname">
 *   <div class="tab-content" data-tab-id="tabname">Content</div>
 * </div>
 */

import type { TabContentManagerOptions } from '#types/tab-content-manager-types.js';
import { devLog, devWarn } from '#src/scripts/helpers/index.js';

const EMPTY_LENGTH = 0;

const DEFAULT_OPTIONS: Required<TabContentManagerOptions> = {
  containerSelector: '[data-active-tab]',
  contentSelector: '.tab-content',
  showClass: 'show',
  activeTabAttribute: 'data-active-tab',
  tabIdAttribute: 'data-tab-id',
  logPrefix: 'Tab Manager'
};

/**
 * Initialize tab content visibility for containers with data-active-tab attributes
 * @param {TabContentManagerOptions} options Configuration options for the tab manager
 */
export function initialiseTabContent(options: TabContentManagerOptions = {}): void {
  const config = { ...DEFAULT_OPTIONS, ...options };

  // Find all containers with active tab data
  const containers = document.querySelectorAll(config.containerSelector);

  if (containers.length > EMPTY_LENGTH) {
    devLog(`${config.logPrefix}: Found ${containers.length} tab container(s)`);

    containers.forEach((container) => {
      if (container instanceof HTMLElement) {
        initialiseContainerTabs(container, config);
      }
    });
  } else {
    devLog(`${config.logPrefix}: No tab containers found with selector '${config.containerSelector}'`);
  }
}

/**
 * Initialize tab content for a specific container
 * @param {HTMLElement} container The container element with data-active-tab
 * @param {Required<TabContentManagerOptions>} config Configuration options
 */
function initialiseContainerTabs(
  container: HTMLElement,
  config: Required<TabContentManagerOptions>
): void {
  const activeTab = container.getAttribute(config.activeTabAttribute);
  const tabContents = container.querySelectorAll(config.contentSelector);
  const activeContent = activeTab !== null ? container.querySelector(
    `${config.contentSelector}[${config.tabIdAttribute}="${activeTab}"]`
  ) : null;

  devLog(`${config.logPrefix}: Processing container with activeTab='${activeTab}', found ${tabContents.length} tab content elements`);

  if (activeTab !== null && tabContents.length > EMPTY_LENGTH && activeContent !== null) {
    // Hide all tab content first
    tabContents.forEach((content) => {
      content.classList.remove(config.showClass);
      devLog(`${config.logPrefix}: Hiding tab content with data-tab-id='${content.getAttribute(config.tabIdAttribute)}'`);
    });

    // Show the active tab content
    activeContent.classList.add(config.showClass);
    devLog(`${config.logPrefix}: Showing '${activeTab}' tab content`);
  } else {
    // Handle error cases
    if (activeTab === null) {
      devWarn(`${config.logPrefix}: No active tab specified for container`);
    }
    if (tabContents.length === EMPTY_LENGTH) {
      devWarn(`${config.logPrefix}: No tab content found in container`);
    }
    if (activeTab !== null && activeContent === null) {
      devWarn(`${config.logPrefix}: No content found for tab: ${activeTab}`);
    }
  }
}
