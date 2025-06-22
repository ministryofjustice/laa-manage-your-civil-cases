/**
 * Sortable Table Manager
 *
 * Handles sortable table functionality with server-side routing.
 * Uses URL-based sorting with fixture data but designed to easily switch to API endpoints.
 */

import type { CaseData } from '#types/case-types.js';

interface SortableTableOptions {
  tableId: string;
  apiEndpoint?: string;
  sortColumn: string;
  onDataUpdate?: (data: CaseData[]) => void;
}

const DEFAULT_OPTIONS: Required<SortableTableOptions> = {
  tableId: 'cases-table',
  apiEndpoint: '',
  sortColumn: 'dateReceived',
  /** Default no-op callback for data updates */
  onDataUpdate: () => { /* default no-op */ }
};

/**
 * Initialize sortable table functionality for server-side sorting
 * @param {Partial<SortableTableOptions>} options Configuration options
 */
export function initializeSortableTable(options: Partial<SortableTableOptions> = {}): void {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const table = document.getElementById(config.tableId);

  if (table === null) {
    console.warn(`Sortable Table: Table with ID '${config.tableId}' not found`);
    return;
  }

  // For server-side sorting, we mainly need to track table interactions
  // and potentially add loading states or analytics
  console.log(`Sortable Table: Initialized table '${config.tableId}' with server-side sorting`);

  // Find all sortable column headers
  const sortableHeaders = table.querySelectorAll('[data-sort]');

  sortableHeaders.forEach(header => {
    if (header instanceof HTMLElement) {
      const sortLink = header.querySelector('.govuk-table__sort-link');

      if (sortLink instanceof HTMLElement) {
        sortLink.addEventListener('click', function (event) {
          // Add loading state
          header.setAttribute('aria-sort', 'loading');

          // Log analytics or perform other actions before navigation
          const sortColumn = header.getAttribute('data-sort');
          if (sortColumn !== null && sortColumn !== '') {
            console.log(`Sortable Table: Sorting by ${sortColumn}`);
          }
          // The actual navigation happens via the href, no need to prevent default
        });
      }
    }
  });
}
