/**
 * Type definitions for the Tab Content Manager utility
 */

export interface TabContentManagerOptions {
    /** CSS selector for tab containers (default: '[data-active-tab]') */
    containerSelector?: string;
    /** CSS selector for tab content elements (default: '.tab-content') */
    contentSelector?: string;
    /** CSS class to show active content (default: 'show') */
    showClass?: string;
    /** Data attribute containing the active tab name (default: 'data-active-tab') */
    activeTabAttribute?: string;
    /** Data attribute containing the tab ID (default: 'data-tab-id') */
    tabIdAttribute?: string;
    /** Prefix for console log messages (default: 'Tab Manager') */
    logPrefix?: string;
}
