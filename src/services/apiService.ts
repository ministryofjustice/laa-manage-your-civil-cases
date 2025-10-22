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
  PaginationMeta,
  ClaSearchApiResponse
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
const API_PREFIX = process.env.API_PREFIX ?? '/cla_provider/api/v1'; // API endpoint prefix - configurable via env
const SEARCH_TIMEOUT_MS = 10000; // 10 second timeout for search API calls
const FIRST_ITEM_INDEX = 0; // Index for accessing the first item in an array

/**
 * Determine case status from CLA API fields
 * @param {Record<string, unknown>} item - Case item from API
 * @returns {string} Readable case status
 */
function determineCaseStatus(item: Record<string, unknown>): string {
  const requiresActionBy = safeString(item.requires_action_by);
  
  // Map CLA API status codes to readable status
  if (requiresActionBy.includes('provider_review') || requiresActionBy.includes('provider')) {
    return 'New';
  }
  
  if (requiresActionBy.includes('operator')) {
    return 'Opened';
  }
  
  if (item.provider_accepted !== null && item.provider_accepted !== undefined) {
    return 'Accepted';
  }
  
  if (item.provider_closed !== null && item.provider_closed !== undefined) {
    return 'Closed';
  }
  
  return '';
}

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
 * Transform raw case item from CLA API to display format
 * @param {unknown} item Raw case item from CLA API
 * @returns {CaseData} Transformed case item
 */
function transformCaseItem(item: unknown): CaseData {
  if (!isRecord(item)) {
    throw new Error('Invalid case item: expected object');
  }

  return {
    fullName: safeString(item.full_name),
    caseReference: safeString(item.reference),
    refCode: safeString(item.reference),
    dateReceived: formatDate(safeString(item.created)),
    caseStatus: determineCaseStatus(item),
    dateOfBirth: formatDate(safeString(item.date_of_birth)),
    lastModified: formatDate(safeOptionalString(item.modified) ?? ''),
    dateClosed: formatDate(safeOptionalString(item.date_closed) ?? ''),
    phoneNumber: safeOptionalString(item.phone_number),
    safeToCall: Boolean(item.safe_to_call),
    announceCall: Boolean(item.announce_call),
    emailAddress: safeOptionalString(item.email_address),
    clientIsVulnerable: Boolean(item.client_is_vulnerable),
    address: safeOptionalString(item.address),
    postcode: safeOptionalString(item.postcode),
    specialNotes: safeOptionalString(item.special_notes)
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
   * @param {CaseApiParams} params - API parameters
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

      // Handle CLA API response format with type safety
      const responseData: unknown = response.data;
      let rawResults: unknown[] = [];
      let totalCount = 0;

      if (isRecord(responseData)) {
        const { results, count } = responseData;
        if (Array.isArray(results)) {
          rawResults = results as unknown[];
        }
        if (typeof count === 'number') {
          totalCount = count;
        } else {
          const { length } = rawResults;
          totalCount = length;
        }
      }

      // Transform the response data
      const transformedData = rawResults.map(transformCaseItem);

      // Extract pagination from response body
      const paginationMeta = {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      };

      devLog(`API: Returning ${transformedData.length} ${caseType} cases (total: ${paginationMeta.total})`);

      
      return {
        data: transformedData,
        pagination: paginationMeta,
        status: 'success' as const
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
  private static prepareSearchParams(params: SearchApiParams): {
    apiParams: Record<string, string>;
    page: number;
    limit: number;
    sortOrder: string;
  } {
    const { keyword, status } = params;
    const page = params.page ?? DEFAULT_PAGE;
    const limit = params.limit ?? DEFAULT_LIMIT;
    const sortOrder = ApiService.determineSortOrder(params.sortOrder);

    const apiParams = ApiService.buildApiParams(keyword, status);

    devLog(`API: GET ${API_PREFIX}/case/ with params: ${JSON.stringify(apiParams, null, JSON_INDENT)}`);

    return { apiParams, page, limit, sortOrder };
  }

  /**
   * Determine the sort order for search parameters
   * @param {string | undefined} sortOrderParam - Raw sort order parameter
   * @returns {string} Determined sort order
   */
  private static determineSortOrder(sortOrderParam: string | undefined): string {
    return sortOrderParam !== undefined && sortOrderParam.trim() !== '' ? sortOrderParam : 'desc';
  }

  /**
   * Build API parameters for CLA search
   * @param {string | undefined} keyword - Search keyword
   * @param {string | undefined} status - Status filter
   * @returns {Record<string, string>} API parameters
   */
  private static buildApiParams(keyword: string | undefined, status: string | undefined): Record<string, string> {
    const apiParams: Record<string, string> = {};

    if (keyword !== undefined && keyword.trim() !== '') {
      apiParams.search = keyword.trim();  // CLA uses 'search' param
    }

    if (status !== undefined && status.trim() !== '' && status !== 'all') {
      apiParams.only = status.trim();     // CLA uses 'only' for status filter
    }

    return apiParams;
  }

  /**
   * Make the search API call to CLA
   * @param {AxiosInstanceWrapper} configuredAxios - Configured axios instance
   * @param {Record<string, string>} apiParams - API parameters
   * @returns {Promise<{ data: ClaSearchApiResponse }>} API response
   */
  private static async makeSearchApiCall(
    configuredAxios: AxiosInstanceWrapper,
    apiParams: Record<string, string>
  ): Promise<{ data: ClaSearchApiResponse }> {
    return await configuredAxios.get(`${API_PREFIX}/case/`, {
      params: apiParams,
      timeout: SEARCH_TIMEOUT_MS  // 10 second timeout as per requirements
    });
  }

  /**
   * Process the search API response
   * @param {{ data: ClaSearchApiResponse }} response - API response
   * @param {ClaSearchApiResponse} response.data - The CLA API response data
   * @param {number} page - Page number
   * @param {number} limit - Results per page
   * @returns {ApiResponse<CaseData>} Processed response
   */
  private static processSearchResponse(
    response: { data: ClaSearchApiResponse },
    page: number,
    limit: number
  ): ApiResponse<CaseData> {
    // Extract results from CLA API response format
    const rawResults = Array.isArray(response.data.results) ? response.data.results : [];
    const totalCount = typeof response.data.count === 'number' ? response.data.count : rawResults.length;

    // Debug: Log the first result to see the actual API structure
    if (rawResults.length > FIRST_ITEM_INDEX) {
      devLog(`API: First raw result structure: ${JSON.stringify(rawResults[FIRST_ITEM_INDEX], null, JSON_INDENT)}`);
    }

    // Transform raw case data to display format
    const transformedData = rawResults.map(transformCaseItem);

    // Debug: Log the first transformed result
    if (transformedData.length > FIRST_ITEM_INDEX) {
      devLog(`API: First transformed result: ${JSON.stringify(transformedData[FIRST_ITEM_INDEX], null, JSON_INDENT)}`);
    }

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
    const { api: { baseUrl } } = config;

    // Safely configure axios defaults
    if (typeof baseUrl === 'string') {
      defaults.baseURL = baseUrl;
    }

    defaults.headers.common['Content-Type'] = 'application/json';
    defaults.headers.common.Accept = 'application/json';

    return axiosMiddleware;
  }
}

// Export the API service
export const apiService = ApiService;
