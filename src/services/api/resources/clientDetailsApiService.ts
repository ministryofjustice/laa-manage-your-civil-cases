/**
 * Client Details API Service
 * Handles client details retrieval and updates
 */

import type { AxiosInstanceWrapper } from '#types/axios-instance-wrapper.js';
import type { ClientDetailsResponse, ClientDetailsApiResponse, ClientHistoryApiResponse } from '#types/api-types.js';
import { devLog, extractAndLogError } from '#src/scripts/helpers/index.js';
import { transformClientDetailsItem } from '../transforms/transformClientDetails.js';
import { transformClientHistoryLogs } from '../transforms/transformClientHistoryLogs.js';
import { configureAxiosInstance } from '../base/BaseApiService.js';
import { API_PREFIX, JSON_INDENT } from '../base/constants.js';

/**
 * Get client details by case reference
 * @param {AxiosInstanceWrapper} axiosMiddleware - Axios middleware from request
 * @param {string} caseReference - Case reference number
 * @returns {Promise<ClientDetailsApiResponse>} API response with client details
 */
export async function getClientDetails(axiosMiddleware: AxiosInstanceWrapper, caseReference: string): Promise<ClientDetailsApiResponse> {
  try {
    devLog(`API: GET ${API_PREFIX}/case/${caseReference}/detailed`);

    const configuredAxios = configureAxiosInstance(axiosMiddleware);

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
export async function updateClientDetails(
  axiosMiddleware: AxiosInstanceWrapper,
  caseReference: string,
  updateData: Partial<ClientDetailsResponse>
): Promise<ClientDetailsApiResponse> {
  try {
    devLog(`API: PATCH ${API_PREFIX}/case/${caseReference}/personal_details/`);
    const configuredAxios = configureAxiosInstance(axiosMiddleware);
    const response = await configuredAxios.patch(`${API_PREFIX}/case/${caseReference}/personal_details/`, updateData);
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
 * Get client history details by case reference
 * @param {AxiosInstanceWrapper} axiosMiddleware - Axios middleware from request
 * @param {string} caseReference - Case reference number
 * @returns {Promise<ClientHistoryApiResponse>} API response with client details
 */
export async function getClientHistoryDetails(axiosMiddleware: AxiosInstanceWrapper, caseReference: string): Promise<ClientHistoryApiResponse> {
  try {
    devLog(`API: GET ${API_PREFIX}/case/${caseReference}/logs/`);

    const configuredAxios = configureAxiosInstance(axiosMiddleware);

    // Call API endpoint
    const response = await configuredAxios.get(`${API_PREFIX}/case/${caseReference}/logs/`);

    devLog(`API: Client history details response: ${JSON.stringify(response.data, null, JSON_INDENT)}`);

    const logs = Array.isArray(response.data) ? response.data.map(transformClientHistoryLogs).filter(log => log.code !== 'MT_CHANGED' && log.code !== 'MT_CREATED') : [];

    return {
      data: logs,
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
