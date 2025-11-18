/**
 * Logs API Service
 * Handles case event logs retrieval from CLA backend
 */

import type { AxiosInstanceWrapper } from '#types/axios-instance-wrapper.js';
import type { LogsApiResponse } from '#types/api-types.js';
import { devLog, extractAndLogError } from '#src/scripts/helpers/index.js';
import { transformLogEntries } from './transforms/transformLogs.js';
import { configureAxiosInstance } from './base/BaseApiService.js';
import { API_PREFIX, JSON_INDENT } from './base/constants.js';

/**
 * Get case event logs by case reference
 * @param {AxiosInstanceWrapper} axiosMiddleware - Axios middleware from request
 * @param {string} caseReference - Case reference number
 * @returns {Promise<LogsApiResponse>} API response with case logs
 */
export async function getCaseLogs(axiosMiddleware: AxiosInstanceWrapper, caseReference: string): Promise<LogsApiResponse> {
  try {
    devLog(`API: GET ${API_PREFIX}/case/${caseReference}/logs/`);

    const configuredAxios = configureAxiosInstance(axiosMiddleware);

    // Call API endpoint
    const response = await configuredAxios.get(`${API_PREFIX}/case/${caseReference}/logs/`);

    devLog(`API: Case logs response: ${JSON.stringify(response.data, null, JSON_INDENT)}`);

    return {
      data: transformLogEntries(response.data),
      status: 'success'
    };

  } catch (error) {
    const errorMessage = extractAndLogError(error, 'API error fetching case logs');

    return {
      data: null,
      status: 'error',
      message: errorMessage
    };
  }
}
