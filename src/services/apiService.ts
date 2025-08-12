/**
 * API Service
 *
 * This service provides an interface for interacting with API servers using
 * the project's axios middleware for consistency.
 *
 * Usage examples:
 * ```typescript
 * // Get cases with sorting and pagination
 * const { data, pagination } = await ApiService.getCases(req.axiosMiddleware, {
 *   caseType: 'new',
 *   sortOrder: 'desc',
 *   page: 1,
 *   limit: 20
 * });
 * ```
 */

import type { CaseData } from '#types/case-types.js';
import type { AxiosInstanceWrapper } from '#types/axios-instance-wrapper.js';
import type {
  ApiResponse,
  CaseApiParams,
  SearchApiParams,
  ClientDetailsResponse,
  ClientDetailsApiResponse,
  PaginationMeta
} from '#types/api-types.js';
import {
  safeString,
  safeOptionalString,
  isRecord,
  devLog,
  formatDate,
  extractAndLogError,
  safeStringFromRecord
} from '#src/scripts/helpers/index.js';
import config from '../../config.js';

// Constants
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = parseInt(process.env.PAGINATION_LIMIT ?? '20', 10); // Configurable via env
const JSON_INDENT = 2;
const EMPTY_TOTAL = 0;
const API_PREFIX = process.env.API_PREFIX ?? '/latest/mock'; // API endpoint prefix - configurable via env

/**
 * Transform raw client details item to display format
 * @param {unknown} item Raw client details item
 * @returns {ClientDetailsResponse} Transformed client details item
 */
function transformClientDetailsItem(item: unknown): ClientDetailsResponse {
  if (!isRecord(item)) {
    throw new Error('Invalid client details item: expected object');
  }

  return {
    // Allow for additional fields from the API first
    ...item,
    // Then override specific fields
    caseReference: safeString(item.caseReference),
    fullName: safeString(item.fullName),
    dateOfBirth: formatDate(safeString(item.dateOfBirth))
  };
}

/**
 * Transform raw case item to display format
 * @param {unknown} item Raw case item
 * @returns {CaseData} Transformed case item
 */
function transformCaseItem(item: unknown): CaseData {
  if (!isRecord(item)) {
    throw new Error('Invalid case item: expected object');
  }

  return {
    fullName: safeString(item.fullName),
    caseReference: safeString(item.caseReference),
    refCode: safeString(item.refCode),
    dateReceived: formatDate(safeString(item.dateReceived)),
    caseStatus: safeString(item.caseStatus),
    dateOfBirth: formatDate(safeString(item.dateOfBirth)),
    lastModified: formatDate(safeOptionalString(item.lastModified) ?? ''),
    dateClosed: formatDate(safeOptionalString(item.dateClosed) ?? ''),
    phoneNumber: safeOptionalString(item.phoneNumber),
    safeToCall: Boolean(item.safeToCall),
    announceCall: Boolean(item.announceCall),
    emailAddress: safeOptionalString(item.emailAddress),
    clientIsVulnerable: Boolean(item.clientIsVulnerable),
    reasonableAdjustments: isRecord(item.reasonableAdjustments) ? item.reasonableAdjustments : undefined,
    language: safeOptionalString(item.language),
    address: safeOptionalString(item.address),
    postcode: safeOptionalString(item.postcode),
    specialNotes: safeOptionalString(item.specialNotes)
  };
}

/**
 * API Service
 * Uses axios middleware from Express request for API calls
 */
class ApiService {
  /**
   * Get cases from API server using axios middleware
   * @param {AxiosInstanceWrapper} axiosMiddleware - Axios middleware from request
   * @param {CaseApiParams} params API parameters
   * @returns {Promise<ApiResponse<CaseData>>} API response with case data and pagination
   */
  static async getCases(axiosMiddleware: AxiosInstanceWrapper, params: CaseApiParams): Promise<ApiResponse<CaseData>> {
    const { caseType, sortBy = 'dateReceived', sortOrder = 'asc' } = params;
    const page = params.page ?? DEFAULT_PAGE;
    const limit = params.limit ?? DEFAULT_LIMIT;

    try {
      devLog(`API: GET ${API_PREFIX}/cases/${caseType}?sortBy=${sortBy}&sortOrder=${sortOrder}&page=${page}&limit=${limit}`);

      const configuredAxios = ApiService.configureAxiosInstance(axiosMiddleware);

      // Call API endpoint
      const response = await configuredAxios.get(`${API_PREFIX}/cases/${caseType}`, {
        params: { sortBy, sortOrder, page, limit }
      });

      // Transform the response data if needed
      const transformedData = Array.isArray(response.data)
        ? response.data.map(transformCaseItem)
        : [];

      // Debug: Log response headers to help troubleshoot pagination issues
      devLog(`API: Response headers: ${JSON.stringify(response.headers, null, JSON_INDENT)}`);

      // Extract pagination metadata from response headers
      const paginationMeta = ApiService.extractPaginationMeta(response.headers, params);

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
   * Get client details by case reference
   * @param {AxiosInstanceWrapper} axiosMiddleware - Axios middleware from request
   * @param {string} caseReference - Case reference number
   * @returns {Promise<ClientDetailsApiResponse>} API response with client details
   */
  static async getClientDetails(axiosMiddleware: AxiosInstanceWrapper, caseReference: string): Promise<ClientDetailsApiResponse> {
    try {
      devLog(`API: GET ${API_PREFIX}/cases/${caseReference}`);

      const configuredAxios = ApiService.configureAxiosInstance(axiosMiddleware);

      // Call API endpoint
      const response = await configuredAxios.get(`${API_PREFIX}/cases/${caseReference}`);

      devLog(`API: Client details response: ${JSON.stringify(response.data, null, JSON_INDENT)}`);

      return {
        data: transformClientDetailsItem(response.data),
        status: 'success'
      };

    } catch (error) {
      const errorMessage = extractAndLogError(error, 'API error');

      return {
        data: null,
        status: 'error',
        message: errorMessage
      };
    }
  }

  /**
   * Update client details by case reference
   * @param {AxiosInstanceWrapper} axiosMiddleware - Axios middleware from request
   * @param {string} caseReference - Case reference number
   * @param {Partial<ClientDetailsResponse>} updateData - Data to update
   * @returns {Promise<ClientDetailsApiResponse>} API response with updated client details
   */
  static async updateClientDetails(
    axiosMiddleware: AxiosInstanceWrapper,
    caseReference: string,
    updateData: Partial<ClientDetailsResponse>
  ): Promise<ClientDetailsApiResponse> {
    try {
      devLog(`API: PUT ${API_PREFIX}/cases/${caseReference}`);
      const configuredAxios = ApiService.configureAxiosInstance(axiosMiddleware);
      const response = await configuredAxios.put(`${API_PREFIX}/cases/${caseReference}`, updateData);
      devLog(`API: Update client details response: ${JSON.stringify(response.data, null, JSON_INDENT)}`);
      return {
        data: transformClientDetailsItem(response.data),
        status: 'success'
      };
    } catch (error) {
      const errorMessage = extractAndLogError(error, 'API error');
      return {
        data: null,
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
  static async searchCases(
    axiosMiddleware: AxiosInstanceWrapper,
    params: SearchApiParams
  ): Promise<ApiResponse<CaseData>> {
    const { keyword, status } = params;
    const page = params.page ?? DEFAULT_PAGE;
    const limit = params.limit ?? DEFAULT_LIMIT;
    // Set sortOrder to 'desc' if not provided or empty
    const sortOrder = params.sortOrder !== undefined && params.sortOrder.trim() !== '' ? params.sortOrder : 'desc';

    try {
      // Build API params - only include status if it has a value
      const apiParams: { keyword: string; sortOrder: string; page: number; limit: number; status?: string } = {
        keyword,
        sortOrder,
        page,
        limit
      };

      if (status !== undefined && status.trim() !== '') {
        apiParams.status = status;
      }

      devLog(`API: GET ${API_PREFIX}/cases/search with params: ${JSON.stringify(apiParams, null, JSON_INDENT)}`);

      const configuredAxios = ApiService.configureAxiosInstance(axiosMiddleware);

      // Call API endpoint
      const response = await configuredAxios.get(`${API_PREFIX}/cases/search`, {
        params: apiParams
      });

      // Transform the response data
      const transformedData = Array.isArray(response.data)
        ? response.data.map(transformCaseItem)
        : [];

      // Extract pagination metadata from response headers (use 'new' as dummy value since it's not used for search)
      const paginationParams: CaseApiParams = { caseType: 'new', page, limit };
      const paginationMeta = ApiService.extractPaginationMeta(response.headers, paginationParams);

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

  /**
   * Extract pagination metadata from response headers
   * @param {unknown} headers - Response headers from axios
   * @param {CaseApiParams} params - API parameters for fallback values
   * @returns {PaginationMeta} Pagination metadata
   */
  private static extractPaginationMeta(headers: unknown, params: CaseApiParams): PaginationMeta {
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
   * Create configured axios instance with API credentials
   * @param {AxiosInstanceWrapper} axiosMiddleware - Axios middleware from request
   * @returns {AxiosInstanceWrapper} Configured axios instance
   */
  private static configureAxiosInstance(axiosMiddleware: AxiosInstanceWrapper): AxiosInstanceWrapper {
    // Override base URL and add API-specific headers
    const { axiosInstance } = axiosMiddleware;
    const { defaults } = axiosInstance;
    const { api: { baseUrl, timeout } } = config;

    // Safely configure axios defaults
    if (typeof baseUrl === 'string') {
      defaults.baseURL = baseUrl;
    }

    if (typeof timeout === 'number') {
      defaults.timeout = timeout;
    }

    defaults.headers.common['Content-Type'] = 'application/json';
    defaults.headers.common.Accept = 'application/json';

    return axiosMiddleware;
  }
}

// Export the API service
export const apiService = ApiService;
