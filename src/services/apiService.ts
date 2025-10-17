/**
 * API Service
 *
 * This service provides an interface for interacting with API servers using
 * the project's axios middleware for consistency.
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
    // Then override specific fields with field name mapping
    caseReference: safeString(item.reference),
    fullName: safeString(item.full_name),
    dateOfBirth: formatDate(safeString(item.date_of_birth))
  };
}

/**
 * Extract results array from API response
 * @param {unknown} data API response data
 * @returns {unknown[]} Results array
 */
function extractResults(data: unknown): unknown[] {
  if (isRecord(data) && Array.isArray(data.results)) {
    return data.results;
  }
  return Array.isArray(data) ? data : [];
}

/**
 * Extract pagination metadata from response body
 * @param {unknown} data API response data
 * @param {number} page Current page
 * @param {number} limit Items per page
 * @returns {PaginationMeta | null} Pagination metadata or null if not found
 */
function extractPaginationFromBody(data: unknown, page: number, limit: number): PaginationMeta | null {
  if (isRecord(data) && typeof data.count === 'number') {
    return {
      total: data.count,
      page,
      limit,
      totalPages: Math.ceil(data.count / limit)
    };
  }
  return null;
}

/**
 * Transform raw case item to display format
 * Handles both mock API format and CLA API format
 * @param {unknown} item Raw case item
 * @returns {CaseData} Transformed case item
 */
function transformCaseItem(item: unknown): CaseData {
  if (!isRecord(item)) {
    throw new Error('Invalid case item: expected object');
  }

  return {
    ...extractBasicInfo(item),
    ...extractDates(item),
    ...extractContactInfo(item),
    ...extractAdditionalInfo(item)
  } as CaseData;
}

/**
 * Extract basic case information
 * @param {Record<string, unknown>} item Raw case item
 * @returns {Partial<CaseData>} Basic case information
 */
function extractBasicInfo(item: Record<string, unknown>): Partial<CaseData> {
  return {
    fullName: safeString(item.fullName || item.full_name),
    caseReference: safeString(item.caseReference || item.reference),
    refCode: safeString(item.refCode || item.reference),
    caseStatus: safeString(item.caseStatus || item.status || 'Unknown')
  };
}

/**
 * Extract date-related information
 * @param {Record<string, unknown>} item Raw case item
 * @returns {Partial<CaseData>} Date information
 */
function extractDates(item: Record<string, unknown>): Partial<CaseData> {
  return {
    dateReceived: formatDate(safeString(item.dateReceived || item.modified || item.created)),
    dateOfBirth: formatDate(safeString(item.dateOfBirth || item.date_of_birth)),
    lastModified: formatDate(safeOptionalString(item.lastModified || item.modified) ?? ''),
    dateClosed: formatDate(safeOptionalString(item.dateClosed || item.date_closed) ?? '')
  };
}

/**
 * Extract contact information
 * @param {Record<string, unknown>} item Raw case item
 * @returns {Partial<CaseData>} Contact information
 */
function extractContactInfo(item: Record<string, unknown>): Partial<CaseData> {
  return {
    phoneNumber: safeOptionalString(item.phoneNumber || item.phone_number),
    emailAddress: safeOptionalString(item.emailAddress || item.email_address),
    address: safeOptionalString(item.address),
    postcode: safeOptionalString(item.postcode)
  };
}

/**
 * Extract additional case information
 * @param {Record<string, unknown>} item Raw case item
 * @returns {Partial<CaseData>} Additional information
 */
function extractAdditionalInfo(item: Record<string, unknown>): Partial<CaseData> {
  return {
    safeToCall: Boolean(item.safeToCall || item.safe_to_call),
    announceCall: Boolean(item.announceCall || item.announce_call),
    clientIsVulnerable: Boolean(item.clientIsVulnerable || item.client_is_vulnerable),
    specialNotes: safeOptionalString(item.specialNotes || item.special_notes)
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
    const { caseType } = params;
    const page = params.page ?? DEFAULT_PAGE;
    const limit = params.limit ?? DEFAULT_LIMIT;

    try {
      devLog(`API: GET ${API_PREFIX}/case?only=${caseType}&page=${page}&limit=${limit}`);

      const configuredAxios = ApiService.configureAxiosInstance(axiosMiddleware);

      // Call API endpoint - using 'only' parameter for case state (i.e. new, opened, closed etc)
      const response = await configuredAxios.get(`${API_PREFIX}/case`, {
        params: {only: caseType}
      });
      devLog(`API: Cases response: ${JSON.stringify(response.data, null, JSON_INDENT)}`);

      // Handle new API response format with results array
      const responseData: unknown = response.data;
      const results = extractResults(responseData);

      // Transform the response data
      const transformedData = results.map(transformCaseItem);

      // Extract pagination from response body (new API format) or fall back to headers
      const paginationMeta = extractPaginationFromBody(responseData, page, limit)
        ?? ApiService.extractPaginationMeta(response.headers, params);

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
    const searchParams = ApiService.prepareSearchParams(params);

    try {
      const configuredAxios = ApiService.configureAxiosInstance(axiosMiddleware);
      const response = await ApiService.makeSearchApiCall(configuredAxios, searchParams.apiParams);

      return ApiService.processSearchResponse(response, searchParams.page, searchParams.limit);

    } catch (error) {
      ApiService.handleSearchError(error);
    }
  }

  /**
   * Prepare search parameters for CLA API
   * @param {SearchApiParams} params - Raw search parameters
   * @returns {object} Processed search parameters
   */
  private static prepareSearchParams(params: SearchApiParams) {
    const { keyword, status } = params;
    const page = params.page ?? DEFAULT_PAGE;
    const limit = params.limit ?? DEFAULT_LIMIT;
    const sortOrder = params.sortOrder !== undefined && params.sortOrder.trim() !== '' ? params.sortOrder : 'desc';

    // Build CLA API params - map internal params to CLA API format
    const apiParams: Record<string, string> = {};

    if (keyword && keyword.trim() !== '') {
      apiParams.search = keyword.trim();  // CLA uses 'search' param
    }

    if (status && status.trim() !== '' && status !== 'all') {
      apiParams.only = status.trim();     // CLA uses 'only' for status filter
    }

    devLog(`API: GET ${API_PREFIX}/case/ with params: ${JSON.stringify(apiParams, null, JSON_INDENT)}`);

    return { apiParams, page, limit, sortOrder };
  }

  /**
   * Make the search API call to CLA
   * @param {AxiosInstanceWrapper} configuredAxios - Configured axios instance
   * @param {Record<string, string>} apiParams - API parameters
   * @returns {Promise<any>} API response
   */
  private static async makeSearchApiCall(configuredAxios: AxiosInstanceWrapper, apiParams: Record<string, string>) {
    return await configuredAxios.get(`${API_PREFIX}/case/`, {
      params: apiParams,
      timeout: 10000  // 10 second timeout as per requirements
    });
  }

  /**
   * Process the search API response
   * @param {any} response - API response
   * @param {number} page - Page number
   * @param {number} limit - Results per page
   * @returns {ApiResponse<CaseData>} Processed response
   */
  private static processSearchResponse(response: any, page: number, limit: number): ApiResponse<CaseData> {
    // Extract results from CLA API response format
    const rawResults = Array.isArray(response.data.results) ? response.data.results : [];
    const totalCount = typeof response.data.count === 'number' ? response.data.count : rawResults.length;

    // Transform raw case data to display format
    const transformedData = rawResults.map(transformCaseItem);

    devLog(`API: Returning ${transformedData.length} search results (total: ${totalCount})`);

    return {
      data: transformedData,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: undefined  // CLA API doesn't provide total pages
      },
      status: 'success'
    };
  }

  /**
   * Handle search API errors
   * @param {unknown} error - Error from API call
   */
  private static handleSearchError(error: unknown): never {
    const errorMessage = extractAndLogError(error, 'API search error');

    // Instead of returning error response, throw the error to be handled by global handler
    const searchError = new Error(errorMessage);
    searchError.cause = error;
    throw searchError;
  }

  /**
   * Add third party contact for a case
   * @param {AxiosInstanceWrapper} axiosMiddleware - Axios middleware from request
   * @param {string} caseReference - Case reference number
   * @param {object} thirdPartyData - Third party data to add
   * @returns {Promise<ClientDetailsApiResponse>} API response with updated client details
   */
  static async addThirdPartyContact(
    axiosMiddleware: AxiosInstanceWrapper,
    caseReference: string,
    thirdPartyData: object
  ): Promise<ClientDetailsApiResponse> {
    try {
      devLog(`API: POST ${API_PREFIX}/cases/${caseReference}/third-party`);
      const configuredAxios = ApiService.configureAxiosInstance(axiosMiddleware);
      const response = await configuredAxios.post(`${API_PREFIX}/cases/${caseReference}/third-party`, thirdPartyData);
      devLog(`API: Add third party response: ${JSON.stringify(response.data, null, JSON_INDENT)}`);
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
   * Update third party contact for a case
   * @param {AxiosInstanceWrapper} axiosMiddleware - Axios middleware from request
   * @param {string} caseReference - Case reference number
   * @param {object} thirdPartyData - Third party data to update
   * @returns {Promise<ClientDetailsApiResponse>} API response with updated client details
   */
  static async updateThirdPartyContact(
    axiosMiddleware: AxiosInstanceWrapper,
    caseReference: string,
    thirdPartyData: object
  ): Promise<ClientDetailsApiResponse> {
    try {
      devLog(`API: PUT ${API_PREFIX}/cases/${caseReference}/third-party`);
      const configuredAxios = ApiService.configureAxiosInstance(axiosMiddleware);
      const response = await configuredAxios.put(`${API_PREFIX}/cases/${caseReference}/third-party`, thirdPartyData);
      devLog(`API: Update third party response: ${JSON.stringify(response.data, null, JSON_INDENT)}`);
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
   * Delete third party contact for a case
   * @param {AxiosInstanceWrapper} axiosMiddleware - Axios middleware from request
   * @param {string} caseReference - Case reference number
   * @returns {Promise<ClientDetailsApiResponse>} API response confirming deletion
   */
  static async deleteThirdPartyContact(
    axiosMiddleware: AxiosInstanceWrapper,
    caseReference: string
  ): Promise<ClientDetailsApiResponse> {
    try {
      devLog(`API: DELETE ${API_PREFIX}/cases/${caseReference}/third-party`);
      const configuredAxios = ApiService.configureAxiosInstance(axiosMiddleware);
      const response = await configuredAxios.delete(`${API_PREFIX}/cases/${caseReference}/third-party`);
      devLog(`API: Delete third party response: ${JSON.stringify(response.data, null, JSON_INDENT)}`);
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
   * Add client support needs for a case
   * @param {AxiosInstanceWrapper} axiosMiddleware - Axios middleware from request
   * @param {string} caseReference - Case reference number
   * @param {object} clientSupportNeeds - Client support needs to add
   * @returns {Promise<ClientDetailsApiResponse>} API response with updated client details
   */
  static async addClientSupportNeeds(
    axiosMiddleware: AxiosInstanceWrapper,
    caseReference: string,
    clientSupportNeeds: object
  ): Promise<ClientDetailsApiResponse> {
    try {
      devLog(`API: POST ${API_PREFIX}/cases/${caseReference}/client-support-needs`);
      const configuredAxios = ApiService.configureAxiosInstance(axiosMiddleware);
      const response = await configuredAxios.post(`${API_PREFIX}/cases/${caseReference}/client-support-needs`, clientSupportNeeds);
      devLog(`API: Add client support needs response: ${JSON.stringify(response.data, null, JSON_INDENT)}`);
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
   * Update client support needs for a case
   * @param {AxiosInstanceWrapper} axiosMiddleware - Axios middleware from request
   * @param {string} caseReference - Case reference number
   * @param {object} clientSupportNeeds - Client support needs to update
   * @returns {Promise<ClientDetailsApiResponse>} API response with updated client details
   */
  static async updateClientSupportNeeds(
    axiosMiddleware: AxiosInstanceWrapper,
    caseReference: string,
    clientSupportNeeds: object
  ): Promise<ClientDetailsApiResponse> {
    try {
      devLog(`API: PUT ${API_PREFIX}/cases/${caseReference}/client-support-needs`);
      const configuredAxios = ApiService.configureAxiosInstance(axiosMiddleware);
      const response = await configuredAxios.put(`${API_PREFIX}/cases/${caseReference}/client-support-needs`, clientSupportNeeds);
      devLog(`API: Update client support needs response: ${JSON.stringify(response.data, null, JSON_INDENT)}`);
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
   * Delete client support needs for a case
   * @param {AxiosInstanceWrapper} axiosMiddleware - Axios middleware from request
   * @param {string} caseReference - Case reference number
   * @returns {Promise<ClientDetailsApiResponse>} API response confirming deletion
   */
  static async deleteClientSupportNeeds(
    axiosMiddleware: AxiosInstanceWrapper,
    caseReference: string
  ): Promise<ClientDetailsApiResponse> {
    try {
      devLog(`API: DELETE ${API_PREFIX}/cases/${caseReference}/client-support-needs`);
      const configuredAxios = ApiService.configureAxiosInstance(axiosMiddleware);
      const response = await configuredAxios.delete(`${API_PREFIX}/cases/${caseReference}/client-support-needs`);
      devLog(`API: Delete client support needs response: ${JSON.stringify(response.data, null, JSON_INDENT)}`);
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
  }  /**
      * Apply client-side date sorting to case data
      * @param {CaseData[]} items - Array of case data to sort
      * @param {string} sortOrder - Sort direction ('asc' or 'desc')
      * @returns {CaseData[]} Sorted array of case data
      */
  private static applyDateSorting(items: CaseData[], sortOrder: string): CaseData[] {
    devLog(`Sorting ${items.length} items with order: ${sortOrder}`);
    const sorted = items.sort((a, b) => {
      const dateA = ApiService.parseDateOnly(a.lastModified || a.dateReceived);
      const dateB = ApiService.parseDateOnly(b.lastModified || b.dateReceived);

      devLog(`Comparing ${a.caseReference} (${a.lastModified}) vs ${b.caseReference} (${b.lastModified})`);

      if (!dateA && !dateB) return 0;
      if (!dateA) return sortOrder === 'desc' ? -1 : 1;
      if (!dateB) return sortOrder === 'desc' ? 1 : -1;

      const comparison = dateA.getTime() - dateB.getTime();
      const result = sortOrder === 'desc' ? -comparison : comparison;
      devLog(`Raw comparison: ${comparison}, adjusted for ${sortOrder}: ${result}`);
      return result;
    });
    devLog(`Sorted result: ${sorted.map(item => item.caseReference).join(', ')}`);
    return sorted;
  }  /**
      * Parse date string in YYYY-MM-DD format strictly
      * @param {string} dateStr - Date string to parse
      * @returns {Date | null} Parsed date or null if invalid
      */
  private static parseDateOnly(dateStr: string): Date | null {
    if (!dateStr) return null;
    // Parse YYYY-MM-DD format strictly
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
    if (!match) return null;

    const [, year, month, day] = match;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
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
