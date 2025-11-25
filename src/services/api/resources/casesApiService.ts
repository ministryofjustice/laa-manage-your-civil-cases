/**
 * Cases API Service
 * Handles case listing and search operations
 */

import type { AxiosInstanceWrapper } from '#types/axios-instance-wrapper.js';
import type {
  ApiResponse,
  CaseApiParams,
  SearchApiParams,
  ClaSearchApiResponse
} from '#types/api-types.js';
import type { CaseData } from '#types/case-types.js';
import { devLog, extractAndLogError } from '#src/scripts/helpers/index.js';
import { transformCaseItem, transformCaseItemForSearch } from '../transforms/transformCase.js';
import {
  extractResults,
  extractPaginationFromBody,
  extractPaginationMeta,
  buildOrderingParam
} from '../utils/pagination.js';
import { configureAxiosInstance } from '../base/BaseApiService.js';
import {
  API_PREFIX,
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  EMPTY_TOTAL,
  JSON_INDENT,
  SEARCH_TIMEOUT_MS
} from '../base/constants.js';

/**
 * Get cases from API server using axios middleware
 * @param {AxiosInstanceWrapper} axiosMiddleware - Axios middleware from request
 * @param {CaseApiParams} params - API parameters
 * @returns {Promise<ApiResponse<CaseData>>} API response with case data and pagination
 */
export async function getCases(axiosMiddleware: AxiosInstanceWrapper, params: CaseApiParams): Promise<ApiResponse<CaseData>> {
  const { caseType, sortBy, sortOrder } = params;
  const page = params.page ?? DEFAULT_PAGE;
  const limit = params.limit ?? DEFAULT_LIMIT;

  try {
    // Build ordering parameter for backend API
    const ordering = buildOrderingParam(sortBy ?? 'provider_assigned_at', sortOrder ?? 'asc');

    devLog(`API: GET ${API_PREFIX}/case?only=${caseType}&ordering=${ordering}&page=${page}&page_size=${limit}`);

    const configuredAxios = configureAxiosInstance(axiosMiddleware);

    // Call API endpoint - using 'only' parameter for case state and 'ordering' for sorting
    const response = await configuredAxios.get(`${API_PREFIX}/case`, {
      params: { only: caseType, ordering, page, page_size: limit }
    });
    devLog(`API: Cases response: ${JSON.stringify(response.data, null, JSON_INDENT)}`);

    // Handle CLA API response format with type safety
    const responseData: unknown = response.data;
    const results = extractResults(responseData);

    // Transform the response data
    const transformedData = results.map(transformCaseItem);

    // Extract pagination from response body (new API format) or fall back to headers
    const paginationMeta = extractPaginationFromBody(responseData, page, limit)
      ?? extractPaginationMeta(response.headers, params);

    devLog(`API: Returning ${transformedData.length} ${caseType} cases (total: ${paginationMeta.total})`);

    return {
      data: transformedData,
      pagination: paginationMeta,
      status: 'success'
    };

  } catch (error) {
    const errorMessage = extractAndLogError(error, 'API error');

    return {
      data: [],
      pagination: { total: EMPTY_TOTAL, page, limit },
      status: 'error',
      message: errorMessage
    };
  }
}

/**
 * Search for cases based on keyword and status
 * @param {AxiosInstanceWrapper} axiosMiddleware - Axios middleware from request
 * @param {object} params - Search parameters
 * @param {string} params.keyword - Search keyword (required)
 * @param {string} [params.status] - Case status filter (optional)
 * @param {number} [params.page] - Page number for pagination
 * @param {number} [params.limit] - Number of results per page
 * @param {string} [params.sortOrder] - Sort direction (asc or desc)
 * @returns {Promise<ApiResponse<CaseData>>} API response with case data and pagination
 */
export async function searchCases(
  axiosMiddleware: AxiosInstanceWrapper,
  params: SearchApiParams
): Promise<ApiResponse<CaseData>> {
  const { keyword, status = '', sortBy = 'modified', sortOrder = 'desc' } = params;
  const page = params.page ?? DEFAULT_PAGE;
  const limit = params.pageSize ?? DEFAULT_LIMIT;

  try {
    const ordering = buildOrderingParam(sortBy, sortOrder);
    // Build API params - CLA uses `search` and `only` fields instead of `keyword` and `status`
    const apiParams: Record<string, string | number> = { page, page_size: limit, ordering };

    if (keyword.trim() !== '') {
      apiParams.search = keyword.trim();
    }

    if (status.trim() !== '') {
      apiParams.only = status;
    }

    devLog(`API: GET ${API_PREFIX}/case/ with params: ${JSON.stringify(apiParams, null, JSON_INDENT)}`);

    const configuredAxios = configureAxiosInstance(axiosMiddleware);

    // Call API endpoint
    const response = await configuredAxios.get<ClaSearchApiResponse>(`${API_PREFIX}/case/`, {
      params: apiParams,
      timeout: SEARCH_TIMEOUT_MS,
    });

    // Handle API response format with results array
    const responseData: ClaSearchApiResponse = response.data;
    const results = extractResults(responseData);

    // Transform the response data
    const transformedData = results.map(transformCaseItemForSearch);

    // Extract pagination from response body (new API format) or fall back to headers
    const paginationParams: CaseApiParams = { caseType: 'new', page, limit };
    const paginationMeta = extractPaginationFromBody(responseData, page, limit)
      ?? extractPaginationMeta(response.headers, paginationParams);

    devLog(`API: Returning ${transformedData.length} search results (total: ${paginationMeta.total})`);

    return {
      data: transformedData,
      pagination: paginationMeta,
      status: 'success'
    };

  } catch (error) {
    const errorMessage = extractAndLogError(error, 'API search error');

    // Instead of returning error response, throw the error to be handled by global handler
    const searchError = new Error(errorMessage);
    searchError.cause = error;
    throw searchError;
  }
}
