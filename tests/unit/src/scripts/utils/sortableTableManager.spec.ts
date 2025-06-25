/**
 * Tests for the sortableTableManager module.
 *
 * @description Tests for the sortable table manager utility with server-side sorting
 */

import { expect } from "chai";
import sinon from "sinon";
import { JSDOM } from "jsdom";
import { initializeSortableTable } from "#src/scripts/utils/sortableTableManager.js";

describe("Sortable Table Manager", () => {
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

  describe("initializeSortableTable", () => {
    it("should initialize table with default options", () => {
      // Setup DOM with a basic table
      const table = document.createElement('table');
      table.id = 'cases-table';
      document.body.appendChild(table);

      // Call the function
      initializeSortableTable();

      // Verify console log
      expect(consoleLogStub.calledWith("Sortable Table: Initialized table 'cases-table' with server-side sorting")).to.be.true;
    });


    it("should handle table with sortable headers", () => {
      // Setup DOM with sortable table
      const table = document.createElement('table');
      table.id = 'cases-table';

      const thead = document.createElement('thead');
      const tr = document.createElement('tr');

      const th1 = document.createElement('th');
      th1.setAttribute('data-sort', 'name');
      const sortLink1 = document.createElement('a');
      sortLink1.className = 'govuk-table__sort-link';
      sortLink1.href = '/cases?sort=name&order=asc';
      th1.appendChild(sortLink1);
      tr.appendChild(th1);

      const th2 = document.createElement('th');
      th2.setAttribute('data-sort', 'date');
      const sortLink2 = document.createElement('a');
      sortLink2.className = 'govuk-table__sort-link';
      sortLink2.href = '/cases?sort=date&order=desc';
      th2.appendChild(sortLink2);
      tr.appendChild(th2);

      thead.appendChild(tr);
      table.appendChild(thead);
      document.body.appendChild(table);

      // Call the function
      initializeSortableTable();

      // Verify table was initialized
      expect(consoleLogStub.calledWith("Sortable Table: Initialized table 'cases-table' with server-side sorting")).to.be.true;

      // Simulate click on first sort link
      sortLink1.click();

      // Verify aria-sort attribute is set to loading
      expect(th1.getAttribute('aria-sort')).to.equal('loading');

      // Verify console log for sorting
      expect(consoleLogStub.calledWith("Sortable Table: Sorting by name")).to.be.true;

      // Simulate click on second sort link
      sortLink2.click();

      // Verify aria-sort attribute is set to loading
      expect(th2.getAttribute('aria-sort')).to.equal('loading');

      // Verify console log for sorting
      expect(consoleLogStub.calledWith("Sortable Table: Sorting by date")).to.be.true;
    });

    it("should handle headers without sort links", () => {
      // Setup DOM with table that has sortable headers but no sort links
      const table = document.createElement('table');
      table.id = 'cases-table';

      const thead = document.createElement('thead');
      const tr = document.createElement('tr');

      const th = document.createElement('th');
      th.setAttribute('data-sort', 'name');
      // No sort link added
      tr.appendChild(th);

      thead.appendChild(tr);
      table.appendChild(thead);
      document.body.appendChild(table);

      // Call the function - should not throw error
      initializeSortableTable();

      // Verify table was initialized
      expect(consoleLogStub.calledWith("Sortable Table: Initialized table 'cases-table' with server-side sorting")).to.be.true;
    });

    it("should handle non-HTMLElement headers gracefully", () => {
      // Setup DOM with table
      const table = document.createElement('table');
      table.id = 'cases-table';

      const thead = document.createElement('thead');
      const tr = document.createElement('tr');

      const th = document.createElement('th');
      th.setAttribute('data-sort', 'name');
      const sortLink = document.createElement('a');
      sortLink.className = 'govuk-table__sort-link';
      th.appendChild(sortLink);
      tr.appendChild(th);

      // Add a text node (not HTMLElement)
      const textNode = document.createTextNode('Text');
      tr.appendChild(textNode);

      thead.appendChild(tr);
      table.appendChild(thead);
      document.body.appendChild(table);

      // Call the function - should not throw error
      initializeSortableTable();

      // Verify table was initialized
      expect(consoleLogStub.calledWith("Sortable Table: Initialized table 'cases-table' with server-side sorting")).to.be.true;
    });

    it("should handle headers with empty or null data-sort attribute", () => {
      // Setup DOM with table
      const table = document.createElement('table');
      table.id = 'cases-table';

      const thead = document.createElement('thead');
      const tr = document.createElement('tr');

      // Header with empty data-sort
      const th1 = document.createElement('th');
      th1.setAttribute('data-sort', '');
      const sortLink1 = document.createElement('a');
      sortLink1.className = 'govuk-table__sort-link';
      th1.appendChild(sortLink1);
      tr.appendChild(th1);

      // Header with no data-sort attribute
      const th2 = document.createElement('th');
      const sortLink2 = document.createElement('a');
      sortLink2.className = 'govuk-table__sort-link';
      th2.appendChild(sortLink2);
      tr.appendChild(th2);

      thead.appendChild(tr);
      table.appendChild(thead);
      document.body.appendChild(table);

      // Call the function
      initializeSortableTable();

      // Simulate clicks - should not log sorting messages for invalid columns
      sortLink1.click();
      sortLink2.click();

      // Verify table was initialized
      expect(consoleLogStub.calledWith("Sortable Table: Initialized table 'cases-table' with server-side sorting")).to.be.true;

      // Verify no sorting console logs for empty/null columns
      expect(consoleLogStub.calledWith("Sortable Table: Sorting by ")).to.be.false;
    });

    it("should work with empty options object", () => {
      // Setup DOM with default table
      const table = document.createElement('table');
      table.id = 'cases-table';
      document.body.appendChild(table);

      // Call the function with empty options
      initializeSortableTable({});

      // Should work with default options
      expect(consoleLogStub.calledWith("Sortable Table: Initialized table 'cases-table' with server-side sorting")).to.be.true;
    });
  });
});
