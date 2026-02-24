/**
 * Split Case API Service
 * Handles case-splitting API interactions
 */

import type { AxiosInstanceWrapper } from '#types/axios-instance-wrapper.js';
import type { FeedbackChoicesApiResponse, FeedbackChoice } from '#types/api-types.js';
import { devLog, extractAndLogError } from '#src/scripts/helpers/index.js';
import { configureAxiosInstance } from '../base/BaseApiService.js';
import { API_PREFIX, JSON_INDENT } from '../base/constants.js';

/**
 * Get radio choices to split case
 * Calls PROVIDER endpoint to retrieve provider name
 * @param {AxiosInstanceWrapper} axiosMiddleware - Axios middleware from request
 * @param {string} providerId - Case reference number
 * @returns {Promise<FeedbackChoicesApiResponse>} API response with provider choices
 */
export async function getProviderChoices(
  axiosMiddleware: AxiosInstanceWrapper,
  providerId: string
): Promise<FeedbackChoicesApiResponse> {
  try {
    devLog(`API: PROVIDER ${API_PREFIX}/provider/${providerId}/`);

    const configuredAxios = configureAxiosInstance(axiosMiddleware);

    // Call API PROVIDER endpoint to get form schema
    const response = await configuredAxios.options(`${API_PREFIX}/provider/${providerId}/`);

    devLog(`API: Feedback choices response: ${JSON.stringify(response.data, null, JSON_INDENT)}`);

    // Extract choices from the OPTIONS response
    const choices: FeedbackChoice[] = response.data?.actions?.POST?.issue?.choices || [];

    return {
      data: choices,
      status: 'success'
    };

  } catch (error) {
    const errorMessage = extractAndLogError(error, 'API error fetching feedback choices');

    return {
      data: null,
      status: 'error',
      message: errorMessage
    };
  }
}