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

import type { CaseData, DateOfBirth } from '#types/case-types.js';
import type { AxiosInstanceWrapper } from '#types/axios-instance-wrapper.js';
import {
  isValidDateOfBirth,
  safeString,
  safeOptionalString,
  isRecord,
  devLog,
  devError
} from '#src/scripts/helpers/index.js';
import { formatDate } from '#src/scripts/helpers/dateFormatter.js';
import config from '../../config.js';

/**
 * Pagination metadata interface
 */
interface PaginationMeta {
  total: number | null;
  page: number;
  limit: number;
  totalPages?: number;
}

/**
 * API response interface with pagination
 */
export interface ApiResponse<T> {
  data: T[];
  pagination: PaginationMeta;
  status: 'success' | 'error';
  message?: string;
}

/**
 * API request parameters for cases
 */
export interface CaseApiParams {
  caseType: 'new' | 'accepted' | 'opened' | 'closed';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  filters?: Record<string, unknown>;
}

/**
 * API request parameters for client details
 */
export interface ClientDetailsApiParams {
  caseReference: string;
}

/**
 * Client details API response interface
 */
export interface ClientDetailsResponse {
  caseReference: string;
  fullName: string;
  dateOfBirth: string;
  [key: string]: unknown; // Allow for additional fields
}

/**
 * API response interface for single client details
 */
export interface ClientDetailsApiResponse {
  data: ClientDetailsResponse | null;
  status: 'success' | 'error';
  message?: string;
}

// Constants
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = parseInt(process.env.PAGINATION_LIMIT ?? '20', 10); // Configurable via env
const JSON_INDENT = 2;
const EMPTY_TOTAL = 0;

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
    caseReference: safeString(item.caseReference),
    fullName: safeString(item.fullName),
    dateOfBirth: safeString(item.dateOfBirth),
    // Allow for additional fields from the API
    ...item
  };
}

/**
 * Transform dateOfBirth object to string format (DD MMM YYYY)
 * @param {DateOfBirth} dateOfBirth DateOfBirth object
 * @returns {string} Formatted date string
 */
function transformDateOfBirth(dateOfBirth: DateOfBirth): string {
  const { day, month, year } = dateOfBirth;
  return `${day} ${month} ${year}`;
}

/**
 * Transform raw case item to display format
 * @param {unknown} item Raw case item
 * @returns {CaseData} Transformed case item
 */
/**
 * Transform case item from raw fixture data to typed CaseData
 * @param {unknown} item Raw case item from fixture
 * @returns {CaseData} Transformed case data
 */
function transformCaseItem(item: unknown): CaseData {
  if (!isRecord(item)) {
    throw new Error('Invalid case item: expected object');
  }

  const { dateOfBirth: dateOfBirthValue } = item;

  // Handle optional date fields
  const lastModifiedStr = safeOptionalString(item.lastModified);
  const dateClosedStr = safeOptionalString(item.dateClosed);

  return {
    fullName: safeString(item.fullName),
    caseReference: safeString(item.caseReference),
    refCode: safeString(item.refCode),
    dateReceived: safeString(item.dateReceived),
    caseStatus: safeString(item.caseStatus),
    dateOfBirth: isValidDateOfBirth(dateOfBirthValue) ? transformDateOfBirth(dateOfBirthValue) : '',
    lastModified: safeOptionalString(item.lastModified),
    dateClosed: safeOptionalString(item.dateClosed),
    // Additional client details fields
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
   * Create configured axios instance with API credentials
   * @param {AxiosInstanceWrapper} axiosMiddleware - Axios middleware from request
   * @returns {AxiosInstanceWrapper} Configured axios instance
   */
  private static configureAxiosInstance(axiosMiddleware: AxiosInstanceWrapper): AxiosInstanceWrapper {
    // Override base URL and add API-specific headers
    const { axiosInstance } = axiosMiddleware;
    const { defaults } = axiosInstance;
    const { api: { baseUrl, timeout, apiKey } } = config;

    // Safely configure axios defaults
    if (typeof baseUrl === 'string') {
      defaults.baseURL = baseUrl;
    }

    if (typeof timeout === 'number') {
      defaults.timeout = timeout;
    }

    if (typeof apiKey === 'string') {
      defaults.headers.common['X-API-Key'] = apiKey;
    }

    defaults.headers.common['Content-Type'] = 'application/json';
    defaults.headers.common.Accept = 'application/json';

    return axiosMiddleware;
  }

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
      devLog(`API: GET /cases/${caseType}?sortBy=${sortBy}&sortOrder=${sortOrder}&page=${page}&limit=${limit}`);

      const configuredAxios = ApiService.configureAxiosInstance(axiosMiddleware);

      // Call API endpoint
      const response = await configuredAxios.get(`/cases/${caseType}`, {
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
      const errorMessage = ApiService.extractErrorMessage(error);
      devError(`API error: ${errorMessage}`);

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
   * @param {ClientDetailsApiParams} params API parameters
   * @returns {Promise<ClientDetailsApiResponse>} API response with client details
   */
  static async getClientDetails(axiosMiddleware: AxiosInstanceWrapper, params: ClientDetailsApiParams): Promise<ClientDetailsApiResponse> {
    const { caseReference } = params;

    try {
      devLog(`API: GET /cases/client-details?caseReference=${caseReference}`);

      const configuredAxios = ApiService.configureAxiosInstance(axiosMiddleware);

      // Call API endpoint
      const response = await configuredAxios.get('/cases/client-details', {
        params: { caseReference }
      });

      devLog(`API: Client details response: ${JSON.stringify(response.data, null, JSON_INDENT)}`);

      return {
        data: transformClientDetailsItem(response.data),
        status: 'success'
      };

    } catch (error) {
      const errorMessage = ApiService.extractErrorMessage(error);
      devError(`API error: ${errorMessage}`);

      return {
        data: null,
        status: 'error',
        message: errorMessage
      };
    }
  }

  /**
   * Extract error message from various error types
   * @param {unknown} error - Error object
   * @returns {string} Error message
   */
  private static extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'Unknown error';
  }

  /**
   * Type guard to check if object has string property
   * @param {unknown} obj - Object to check
   * @param {string} key - Key to check for
   * @returns {boolean} True if object has string property at key
   */
  private static hasStringProperty(obj: unknown, key: string): obj is Record<string, unknown> {
    return (
      obj !== null &&
      obj !== undefined &&
      typeof obj === 'object' &&
      key in obj
    );
  }

  /**
   * Safely extract a string value from headers object
   * @param {unknown} headers - Headers object
   * @param {string} key - Header key to look for
   * @returns {string | null} String value or null
   */
  private static getHeaderString(headers: unknown, key: string): string | null {
    if (ApiService.hasStringProperty(headers, key)) {
      const { [key]: headerValue } = headers;
      return typeof headerValue === 'string' && headerValue.trim() !== '' ? headerValue : null;
    }
    return null;
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

    // Extract total count from header
    const totalFromHeader = ApiService.getHeaderString(headers, 'x-total-count');

    // Extract page from header
    const pageFromHeader = ApiService.getHeaderString(headers, 'x-page');

    // Extract limit from header
    const limitFromHeader = ApiService.getHeaderString(headers, 'x-per-page');

    // Extract total pages from header
    const totalPagesFromHeader = ApiService.getHeaderString(headers, 'x-total-pages');

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
}

// Export the API service
export const apiService = ApiService;
