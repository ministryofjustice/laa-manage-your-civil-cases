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
  ClaSearchApiResponse,
  PaginationMeta
} from '#types/api-types.js';
import {
  safeString,
  safeOptionalString,
  isRecord,
  devLog,
  formatDate,
  extractAndLogError,
  transformContactDetails,
  transformClientSupportNeeds,
  transformThirdParty,
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

/**
 * Transform raw client details item to display format
 * Maps nested API structures (personal_details, adaptation_details, thirdparty_details)
 * @param {unknown} item Raw client details item
 * @returns {ClientDetailsResponse} Transformed client details item
 */
function transformClientDetailsItem(item: unknown): ClientDetailsResponse {
  if (!isRecord(item)) {
    throw new Error('Invalid client details item: expected object');
  }

  // Extract basic client information
  const caseReference = safeString(item.reference);
  const laaReference = safeString(item.laa_reference);
  const fullName = safeString(item.full_name);
  const dateOfBirth = formatDate(safeString(item.date_of_birth));
  const caseStatus = safeString(item.state);

  // eslint-disable-next-line @typescript-eslint/naming-convention -- `provider_assigned_at` matches API response field
  const provider_assigned_at = formatDate(safeString(item.provider_assigned_at))

  // Transform contact details
  const contactDetails = transformContactDetails(item.personal_details);

  // Transform client support needs
  const clientSupportNeeds = transformClientSupportNeeds(item.adaptation_details);

  // Transform third party contact
  const thirdParty = transformThirdParty(item.thirdparty_details);

  return {
    provider_assigned_at,
    laaReference,
    caseReference,
    fullName,
    dateOfBirth,
    caseStatus,
    ...contactDetails,
    clientSupportNeeds,
    thirdParty
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
    laaReference: safeString(item.laa_reference),
    refCode: safeString(item.reference),
    provider_assigned_at: formatDate(safeString(item.provider_assigned_at)),
    caseStatus: safeString(item.caseStatus),
    dateOfBirth: formatDate(safeString(item.date_of_birth)),
    modified: formatDate(safeOptionalString(item.modified) ?? ''),
    provider_closed: formatDate(safeOptionalString(item.provider_closed) ?? ''),
    phoneNumber: safeOptionalString(item.phone_number),
    safeToCall: Boolean(item.safe_to_call),
    announceCall: Boolean(item.announce_call),
    emailAddress: safeOptionalString(item.email_address),
    clientIsVulnerable: Boolean(item.client_is_vulnerable),
    address: safeOptionalString(item.address),
    postcode: safeOptionalString(item.postcode)
  };
}

/**
 * Transform raw case item from CLA API to display format in Search results
 * @param {unknown} item Raw case item from CLA API
 * @returns {CaseData} Transformed case item
 */
function transformCaseItemForSearch(item: unknown): CaseData {
  if (!isRecord(item)) {
    throw new Error('Invalid case item: expected object');
  }

  // TODO add state to the Search endpoint response, so we can remove `determineCaseStatus` and maybe even `transformCaseItemForSearch`
  /**
   * Determine case status from CLA API fields for the Search endpoint
   * @param {Record<string, unknown>} item - Case item from API
   * @returns {string} Readable case status
   */
  function determineCaseStatus(item: Record<string, unknown>): string {
    const viewed = Boolean(item.provider_viewed);
    const accepted = Boolean(item.provider_accepted);
    const closed = Boolean(item.provider_closed);

    if (!viewed && !accepted && !closed) {
      return 'New';
    }
    if (viewed && !accepted && !closed) {
      return 'Opened';
    }
    if (accepted && !closed) {
      return 'Accepted';
    }
    if (closed) {
      return 'Closed';
    }
    return '';
  }

  return {
    fullName: safeString(item.full_name),
    caseReference: safeString(item.reference),
    laaReference: safeString(item.laa_reference),
    refCode: safeString(item.reference),
    phoneNumber: safeOptionalString(item.phone_number),
    dateOfBirth: formatDate(safeString(item.date_of_birth)),
    caseStatus: determineCaseStatus(item),
    provider_assigned_at: formatDate(safeString(item.provider_assigned_at)),
    modified: formatDate(safeOptionalString(item.modified) ?? ''),
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
 * Extract pagination metadata from API response body (new format)
 * @param {unknown} data API response data
 * @param {number} requestedPage Current page from request
 * @param {number} limit Items per page
 * @returns {PaginationMeta | null} Pagination metadata or null if not found
 */
function extractPaginationFromBody(data: unknown, requestedPage: number, limit: number): PaginationMeta | null {
  if (isRecord(data) && typeof data.count === 'number') {
    // Calculate current page from next/previous URLs or fall back to requested page
    let currentPage = requestedPage;

    const PAGE_REGEX = /[?&]page=(\d+)/;
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
 * Build ordering parameter for CLA API
 * @param {string} sortBy - Field to sort by
 * @param {string} sortOrder - Sort order ('asc' or 'desc')
 * @returns {string} Ordering parameter (e.g., 'modified' or '-modified')
 */
function buildOrderingParam(sortBy: string, sortOrder: string): string {
  return sortOrder === 'desc' ? `-${sortBy}` : sortBy;
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
    const { caseType, sortBy, sortOrder } = params;
    const page = params.page ?? DEFAULT_PAGE;
    const limit = params.limit ?? DEFAULT_LIMIT;

    try {
      // Build ordering parameter for backend API
      const ordering = buildOrderingParam(sortBy ?? 'provider_assigned_at', sortOrder ?? 'asc');

      devLog(`API: GET ${API_PREFIX}/case?only=${caseType}&ordering=${ordering}&page=${page}&page_size=${limit}`);

      const configuredAxios = ApiService.configureAxiosInstance(axiosMiddleware);

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
      devLog(`API: GET ${API_PREFIX}/case/${caseReference}/detailed`);

      const configuredAxios = ApiService.configureAxiosInstance(axiosMiddleware);

      // Call API endpoint
      const response = await configuredAxios.get(`${API_PREFIX}/case/${caseReference}/detailed`);

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

      const configuredAxios = ApiService.configureAxiosInstance(axiosMiddleware);

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
        ?? ApiService.extractPaginationMeta(response.headers, paginationParams);

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
