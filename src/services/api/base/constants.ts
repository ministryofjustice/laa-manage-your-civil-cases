/**
 * API Service Constants
 */

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = parseInt(process.env.PAGINATION_LIMIT ?? '20', 10);
export const JSON_INDENT = 2;
export const EMPTY_TOTAL = 0;
export const API_PREFIX = process.env.API_PREFIX ?? '/cla_provider/api/v1';
export const SEARCH_TIMEOUT_MS = 10000; // 10 second timeout for search API calls
