/**
 * Base API Service
 * Provides shared utilities for all API services
 */

import type { AxiosInstanceWrapper } from '#types/axios-instance-wrapper.js';
import type { ClientDetailsApiResponse } from '#types/api-types.js';
import { extractAndLogError, devLog } from '#src/scripts/helpers/index.js';
import { transformClientDetailsItem } from '../transforms/transformClientDetails.js';
import { API_PREFIX, JSON_INDENT } from './constants.js';
import config from '../../../../config.js';

/**
 * Generic API call wrapper with error handling
 * @template T
 * @param {Function} apiCall - Async function that makes the API call
 * @param {string} errorContext - Context for error logging
 * @returns {Promise<T>} API response
 */
export async function handleApiCall<T>(
  apiCall: () => Promise<T>,
  errorContext: string
): Promise<T> {
  try {
    return await apiCall();
  } catch (error) {
    const errorMessage = extractAndLogError(error, errorContext);
    throw new Error(errorMessage, { cause: error });
  }
}

/**
 * PATCH endpoint then re-fetch full case details
 * Used by client support needs and third party operations
 * @param {AxiosInstanceWrapper} axiosMiddleware - Axios middleware from request
 * @param {object} options - PATCH operation options
 * @param {string} options.caseReference - Case reference number
 * @param {string} options.endpoint - API endpoint to PATCH
 * @param {object} options.payload - Data to send in PATCH request
 * @param {string} options.operation - Operation description for logging
 * @returns {Promise<ClientDetailsApiResponse>} Updated client details
 */
export async function patchAndRefetch(
  axiosMiddleware: AxiosInstanceWrapper,
  options: { caseReference: string; endpoint: string; payload: object; operation: string }
): Promise<ClientDetailsApiResponse> {
  const { caseReference, endpoint, payload, operation } = options;
  try {
    devLog(`API: PATCH ${API_PREFIX}${endpoint} (${operation})`);
    const configuredAxios = configureAxiosInstance(axiosMiddleware);
    const response = await configuredAxios.patch(`${API_PREFIX}${endpoint}`, payload);
    devLog(`API: ${operation} response: ${JSON.stringify(response.data, null, JSON_INDENT)}`);

    // Re-fetch full case data
    const reFetchedFullData = await configuredAxios.get(`${API_PREFIX}/case/${caseReference}/detailed`);
    devLog(`API: Re-fetched case after ${operation}: ${JSON.stringify(reFetchedFullData.data, null, JSON_INDENT)}`);

    return {
      data: transformClientDetailsItem(reFetchedFullData.data),
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
 * Configure axios instance with API credentials and headers
 * @param {AxiosInstanceWrapper} axiosMiddleware - Axios middleware from request
 * @returns {AxiosInstanceWrapper} Configured axios instance
 */
export function configureAxiosInstance(axiosMiddleware: AxiosInstanceWrapper): AxiosInstanceWrapper {
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
