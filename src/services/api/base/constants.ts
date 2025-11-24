/**
 * API Service Constants
 */

import config from '../../../../config.js';

/** Default page number for pagination (used in casesApiService.getCases, searchCases and pagination.extractPaginationMeta) */
export const DEFAULT_PAGE = config.pagination.defaultPage;

/** Default items per page for pagination, configurable via PAGINATION_LIMIT env var (used in casesApiService.getCases, searchCases and pagination.extractPaginationMeta) */
export const DEFAULT_LIMIT = config.pagination.defaultLimit;

/** Indentation level for JSON.stringify in debug logs (used in all API service files for development logging) */
export const JSON_INDENT = 2;

/** Fallback value for total count when API returns error (used in casesApiService.getCases) */
export const EMPTY_TOTAL = 0;

/** Base URL prefix for CLA Provider API endpoints, configurable via API_PREFIX env var (used in all resource API services and BaseApiService) */
export const API_PREFIX = process.env.API_PREFIX ?? '/cla_provider/api/v1';

/** Timeout in milliseconds for search API calls to prevent hanging requests (used in casesApiService.searchCases) */
export const SEARCH_TIMEOUT_MS = 10000;