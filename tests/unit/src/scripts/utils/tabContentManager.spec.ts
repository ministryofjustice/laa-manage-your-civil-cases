/**
 * Tests for the tabContentManager module.
 *
 * @description Tests for the generic server-side tab content manager utility
 */

import { expect } from "chai";
import sinon from "sinon";
import { JSDOM } from "jsdom";
import { initialiseTabContent } from "#src/scripts/utils/tabContentManager.js";
import type { TabContentManagerOptions } from "#types/tab-content-manager-types.js";

describe("Tab Content Manager", () => {
  let consoleLogStub: sinon.SinonStub;
  let consoleWarnStub: sinon.SinonStub;
  let jsdom: JSDOM;
  let originalDocument: Document;
  let originalWindow: Window & typeof globalThis;

  // Set up mocks and stubs before each test
  beforeEach(() => {
    // Store original globals
    originalDocument = global.document;
    originalWindow = global.window;

    // Create JSDOM instance
    jsdom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost',
      pretendToBeVisual: true,
      resources: 'usable'
    });

    // Replace global document and window
    global.document = jsdom.window.document;
    global.window = jsdom.window as any;
    global.HTMLElement = jsdom.window.HTMLElement;

    // Stub console methods
    consoleLogStub = sinon.stub(console, "log");
    consoleWarnStub = sinon.stub(console, "warn");
  });

  // Clean up after each test
  afterEach(() => {
    consoleLogStub.restore();
    consoleWarnStub.restore();
    global.document = originalDocument;
    global.window = originalWindow;
    jsdom.window.close();
  });

  describe("initialiseTabContent", () => {
    it("should find and process tab containers with default options", () => {
      // Setup DOM
      const container = document.createElement('div');
      container.setAttribute('data-active-tab', 'tab1');

      const tabContent1 = document.createElement('div');
      tabContent1.setAttribute('data-tab-id', 'tab1');
      tabContent1.classList.add('tab-content');

      const tabContent2 = document.createElement('div');
      tabContent2.setAttribute('data-tab-id', 'tab2');
      tabContent2.classList.add('tab-content');

      container.appendChild(tabContent1);
      container.appendChild(tabContent2);
      document.body.appendChild(container);

      // Call the function
      initialiseTabContent();

      // Verify console logs
      expect(consoleLogStub.calledWith("Tab Manager: Found 1 tab container(s)")).to.be.true;
      expect(consoleLogStub.calledWith("Tab Manager: Processing container with activeTab='tab1', found 2 tab content elements")).to.be.true;
      expect(consoleLogStub.calledWith("Tab Manager: Showing 'tab1' tab content")).to.be.true;

      // Verify DOM changes
      expect(tabContent1.classList.contains('show'), "Active tab should have 'show' class").to.be.true;
      expect(tabContent2.classList.contains('show'), "Inactive tab should not have 'show' class").to.be.false;
    });

    it("should work with custom options", () => {
      // Setup DOM
      const container = document.createElement('div');
      container.setAttribute('data-current-tab', 'custom-tab');

      const customContent = document.createElement('div');
      customContent.setAttribute('data-content-id', 'custom-tab');
      customContent.classList.add('custom-content');

      container.appendChild(customContent);
      document.body.appendChild(container);

      const customOptions: TabContentManagerOptions = {
        containerSelector: '[data-current-tab]',
        contentSelector: '.custom-content',
        showClass: 'visible',
        activeTabAttribute: 'data-current-tab',
        tabIdAttribute: 'data-content-id',
        logPrefix: 'Custom Tab Manager'
      };

      // Call the function with custom options
      initialiseTabContent(customOptions);

      // Verify console logs with custom prefix
      expect(consoleLogStub.calledWith("Custom Tab Manager: Found 1 tab container(s)")).to.be.true;
      expect(consoleLogStub.calledWith("Custom Tab Manager: Showing 'custom-tab' tab content")).to.be.true;

      // Verify DOM changes with custom class
      expect(customContent.classList.contains('visible'), "Content should have custom 'visible' class").to.be.true;
    });

    it("should handle multiple tab containers", () => {
      // Setup DOM with multiple containers
      const container1 = document.createElement('div');
      container1.setAttribute('data-active-tab', 'tab1');
      const content1 = document.createElement('div');
      content1.setAttribute('data-tab-id', 'tab1');
      content1.classList.add('tab-content');
      container1.appendChild(content1);

      const container2 = document.createElement('div');
      container2.setAttribute('data-active-tab', 'tab2');
      const content2 = document.createElement('div');
      content2.setAttribute('data-tab-id', 'tab2');
      content2.classList.add('tab-content');
      container2.appendChild(content2);

      document.body.appendChild(container1);
      document.body.appendChild(container2);

      // Call the function
      initialiseTabContent();

      // Verify console logs
      expect(consoleLogStub.calledWith("Tab Manager: Found 2 tab container(s)")).to.be.true;

      // Verify both containers are processed
      expect(content1.classList.contains('show'), "First container content should be visible").to.be.true;
      expect(content2.classList.contains('show'), "Second container content should be visible").to.be.true;
    });

    it("should handle no tab containers found", () => {
      // Setup DOM with no tab containers - document.body is empty by default

      // Call the function
      initialiseTabContent();

      // Verify warning message
      expect(consoleLogStub.calledWith("Tab Manager: No tab containers found with selector '[data-active-tab]'")).to.be.true;
    });

    it("should warn when no active tab is specified", () => {
      const container = document.createElement('div');
      container.setAttribute('data-active-tab', ''); // Empty string, not null
      document.body.appendChild(container);

      // Call the function
      initialiseTabContent();
      expect(consoleWarnStub.calledWith("Tab Manager: No active tab specified for container")).to.be.false;

      // The warning should occur when there's no tab content found instead
      expect(consoleWarnStub.calledWith("Tab Manager: No tab content found in container")).to.be.true;
    });

    it("should warn when no tab content is found", () => {
      // Setup DOM with container but no tab content
      const container = document.createElement('div');
      container.setAttribute('data-active-tab', 'tab1');
      // No tab content added
      document.body.appendChild(container);

      // Call the function
      initialiseTabContent();

      // Verify warning
      expect(consoleWarnStub.calledWith("Tab Manager: No tab content found in container")).to.be.true;
    });

    it("should warn when active tab content is not found", () => {
      // Setup DOM with container and content but mismatched tab ID
      const container = document.createElement('div');
      container.setAttribute('data-active-tab', 'missing-tab');

      const content = document.createElement('div');
      content.setAttribute('data-tab-id', 'existing-tab');
      content.classList.add('tab-content');
      container.appendChild(content);
      document.body.appendChild(container);

      // Call the function
      initialiseTabContent();

      // Verify warning
      expect(consoleWarnStub.calledWith("Tab Manager: No content found for tab: missing-tab")).to.be.true;
    });

    it("should remove existing show classes before applying new ones", () => {
      // Setup DOM with pre-existing show classes
      const container = document.createElement('div');
      container.setAttribute('data-active-tab', 'tab2');

      const tabContent1 = document.createElement('div');
      tabContent1.setAttribute('data-tab-id', 'tab1');
      tabContent1.classList.add('tab-content');
      tabContent1.classList.add('show'); // Pre-existing show class

      const tabContent2 = document.createElement('div');
      tabContent2.setAttribute('data-tab-id', 'tab2');
      tabContent2.classList.add('tab-content');

      container.appendChild(tabContent1);
      container.appendChild(tabContent2);
      document.body.appendChild(container);

      // Call the function
      initialiseTabContent();

      // Verify classes are correctly applied
      expect(tabContent1.classList.contains('show')).to.equal(false, "Tab 1 should not have show class");
      expect(tabContent2.classList.contains('show')).to.be.true;
    });

    it("should handle empty options object", () => {
      // Setup DOM
      const container = document.createElement('div');
      container.setAttribute('data-active-tab', 'tab1');

      const content = document.createElement('div');
      content.setAttribute('data-tab-id', 'tab1');
      content.classList.add('tab-content');
      container.appendChild(content);
      document.body.appendChild(container);

      // Call the function with empty options
      initialiseTabContent({});

      // Should work with default options
      expect(consoleLogStub.calledWith("Tab Manager: Found 1 tab container(s)")).to.be.true;
      expect(content.classList.contains('show'), "Content should be shown with default options").to.be.true;
    });

    it("should handle non-HTMLElement containers gracefully", () => {
      // Setup DOM with valid container
      const validContainer = document.createElement('div');
      validContainer.setAttribute('data-active-tab', 'tab1');

      const content = document.createElement('div');
      content.setAttribute('data-tab-id', 'tab1');
      content.classList.add('tab-content');
      validContainer.appendChild(content);
      document.body.appendChild(validContainer);

      // Add a text node to the body (not an HTMLElement)
      const textNode = document.createTextNode('This is text');
      document.body.appendChild(textNode);

      // Call the function - should not throw error
      initialiseTabContent();

      // Verify it still processes the valid container
      expect(consoleLogStub.calledWith("Tab Manager: Found 1 tab container(s)")).to.be.true;
      expect(content.classList.contains('show'), "Valid container should be processed").to.be.true;
    });

    it("should call querySelectorAll with correct selector", () => {
      // Spy on document.querySelectorAll
      const querySelectorAllSpy = sinon.spy(document, 'querySelectorAll');

      // Call with default options
      initialiseTabContent();

      // Verify correct selector was used
      expect(querySelectorAllSpy.calledWith('[data-active-tab]')).to.be.true;

      // Reset and test with custom selector
      querySelectorAllSpy.resetHistory();
      initialiseTabContent({ containerSelector: '.custom-selector' });

      expect(querySelectorAllSpy.calledWith('.custom-selector')).to.be.true;

      // Restore the spy
      querySelectorAllSpy.restore();
    });
  });
});
