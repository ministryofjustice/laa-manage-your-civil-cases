/**
 * Pagination Types
 *
 * Type definitions for pagination functionality
 */

/**
 * Pagination item representing a single page link
 */
export interface PaginationItem {
  number: number;
  href: string;
  current: boolean;
}

/**
 * Pagination link for previous/next navigation
 */
export interface PaginationLink {
  href: string;
}

/**
 * Complete pagination metadata including links and page information
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  items: PaginationItem[];
  previous: PaginationLink | null;
  next: PaginationLink | null;
}

/**
 * Result of pagination operation with sliced data and metadata
 */
export interface PaginationResult<T> {
  slicedItems: T[];
  paginationMeta: PaginationMeta;
}