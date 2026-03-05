/**
 * Split Case API Service
 * Handles case-splitting API interactions
 */

import type { AxiosInstanceWrapper } from '#types/axios-instance-wrapper.js';
import type { ProviderSplitChoicesApiResponse } from '#types/api-types.js';
import { devLog, extractAndLogError } from '#src/scripts/helpers/index.js';
import { configureAxiosInstance } from '../base/BaseApiService.js';
import { API_PREFIX, JSON_INDENT } from '../base/constants.js';

/**
 * Get radio choices to split case
 * Calls provider endpoint to retrieve provider name
 * @param {AxiosInstanceWrapper} axiosMiddleware - Axios middleware from request
 * @param {string} providerId - Provider reference number
 * @returns {Promise<ProviderSplitChoicesApiResponse>} API response with provider choices
 */
export async function getProviderChoices(
  axiosMiddleware: AxiosInstanceWrapper,
  providerId: string
): Promise<ProviderSplitChoicesApiResponse> {
  devLog(`API: GET ${API_PREFIX}/provider/${providerId}/`);
  const configuredAxios = configureAxiosInstance(axiosMiddleware);
  try {
    // Call API provider endpoint to get form options
    const response = await configuredAxios.get(`${API_PREFIX}/provider/${providerId}/`);

    devLog(`API: Provider split choices response: ${JSON.stringify(response.data, null, JSON_INDENT)}`);

    return {
      data: response.data,
      status: 'success'
    };

  } catch (error) {
    const errorMessage = extractAndLogError(error, 'API error fetching provider split choices');

    return {
      data: null,
      status: 'error',
      message: errorMessage
    };
  }
}