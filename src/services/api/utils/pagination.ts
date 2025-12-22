/**
 * Pagination Utilities
 * Utilities for handling pagination in API responses
 */

import type { PaginationMeta, CaseApiParams } from '#types/api-types.js';
import { isRecord, safeStringFromRecord, devLog } from '#src/scripts/helpers/index.js';
import { DEFAULT_PAGE, DEFAULT_LIMIT } from '../base/constants.js';

/**
 * Extract results array from API response
 * @param {unknown} data API response data
 * @returns {unknown[]} Results array
 */
export function extractResults(data: unknown): unknown[] {
  if (isRecord(data) && Array.isArray(data.results)) {
    return data.results;
  }
  return Array.isArray(data) ? data : [];
}

/**
 * Extract pagination metadata from API response body (new format)
 * @param {unknown} data API response data
 * @param {number} requestedPage Current page from request
 * @param {number} limit Items per page
 * @returns {PaginationMeta | null} Pagination metadata or null if not found
 */
export function extractPaginationFromBody(data: unknown, requestedPage: number, limit: number): PaginationMeta | null {
  if (isRecord(data) && typeof data.count === 'number') {
    // Calculate current page from next/previous URLs or fall back to requested page
    let currentPage = requestedPage;

    const PAGE_REGEX = /[?&]page=(?<page>\d+)/;
    const NEXT_PAGE_OFFSET = 1;
    const PREV_PAGE_OFFSET = 1;

    // Try to extract current page from next URL (page=X means current page is X-1)
    if (typeof data.next === 'string') {
      const nextMatch = PAGE_REGEX.exec(data.next);
      if (nextMatch !== null) {
        currentPage = parseInt(nextMatch[NEXT_PAGE_OFFSET], 10) - NEXT_PAGE_OFFSET;
      }
    }
    // Try to extract current page from previous URL (page=X means current page is X+1)
    else if (typeof data.previous === 'string') {
      const prevMatch = PAGE_REGEX.exec(data.previous);
      if (prevMatch !== null) {
        currentPage = parseInt(prevMatch[NEXT_PAGE_OFFSET], 10) + PREV_PAGE_OFFSET;
      }
    }

    return {
      total: data.count,
      page: currentPage,
      limit,
      totalPages: Math.ceil(data.count / limit)
    };
  }
  return null;
}

/**
 * Extract pagination metadata from response headers
 * @param {unknown} headers - Response headers from axios
 * @param {CaseApiParams} params - API parameters for fallback values
 * @returns {PaginationMeta} Pagination metadata
 */
export function extractPaginationMeta(headers: unknown, params: CaseApiParams): PaginationMeta {
  const page = params.page ?? DEFAULT_PAGE;
  const limit = params.limit ?? DEFAULT_LIMIT;
  
  // Extract values from headers using the improved utility
  const totalFromHeader = safeStringFromRecord(headers, 'x-total-count');
  const pageFromHeader = safeStringFromRecord(headers, 'x-page');
  const limitFromHeader = safeStringFromRecord(headers, 'x-per-page');
  const totalPagesFromHeader = safeStringFromRecord(headers, 'x-total-pages');
  
  let total = totalFromHeader !== null ? parseInt(totalFromHeader, 10) : null;
  
  // If we have totalPages but no total, calculate it
  if (total === null && totalPagesFromHeader !== null) {
    const totalPages = parseInt(totalPagesFromHeader, 10);
    total = totalPages * limit;
    devLog(`API: Calculated total from X-Total-Pages: ${totalPages} pages × ${limit} = ${total} items`);
  }
  
  return {
    total,
    page: pageFromHeader !== null ? parseInt(pageFromHeader, 10) : page,
    limit: limitFromHeader !== null ? parseInt(limitFromHeader, 10) : limit,
    totalPages: totalPagesFromHeader !== null ? parseInt(totalPagesFromHeader, 10) : undefined
  };
}

/**
 * Build ordering parameter for CLA API
 * @param {string} sortBy - Field to sort by
 * @param {string} sortOrder - Sort order ('asc' or 'desc')
 * @returns {string} Ordering parameter (e.g., 'modified' or '-modified')
 */
export function buildOrderingParam(sortBy: string, sortOrder: string): string {
  return sortOrder === 'desc' ? `-${sortBy}` : sortBy;
}
