/**
 * Change Case State Service
 *
 * This service handles case state transitions (accept, close, etc.)
 * Extracted from apiService.ts to reduce file size and improve maintainability.
 */

import type { AxiosInstanceWrapper } from '#types/axios-instance-wrapper.js';
import type { ClientDetailsApiResponse } from '#types/api-types.js';
import { devLog, extractAndLogError } from '#src/scripts/helpers/index.js';
import { configureAxiosInstance } from '#src/services/apiServiceHelpers.js';

// Constants
const JSON_INDENT = 2;
const API_PREFIX = process.env.API_PREFIX ?? '/cla_provider/api/v1';

/**
 * Change Case State Service
 * Handles case state transitions
 */
class ChangeCaseStateService {
  /**
   * Accept a case (change status to advising)
   * @param {AxiosInstanceWrapper} axiosMiddleware - Axios middleware from request
   * @param {string} caseReference - Case reference number
   * @returns {Promise<ClientDetailsApiResponse>} API response with updated client details
   */
  static async acceptCase(
    axiosMiddleware: AxiosInstanceWrapper,
    caseReference: string
  ): Promise<ClientDetailsApiResponse> {
    try {
      devLog(`API: POST ${API_PREFIX}/case/${caseReference}/accept/`);
      const configuredAxios = configureAxiosInstance(axiosMiddleware);
      await configuredAxios.post(`${API_PREFIX}/case/${caseReference}/accept/`);
      devLog(`API: Case accepted successfully, fetching updated details`);

      // Re-fetch the full case details to get complete data structure
      const detailedResponse = await configuredAxios.get(`${API_PREFIX}/case/${caseReference}/detailed`);
      devLog(`API: Accept case - full details: ${JSON.stringify(detailedResponse.data, null, JSON_INDENT)}`);

      // Import transformClientDetailsItem dynamically to avoid circular dependency
      const { transformClientDetailsItem } = await import('#src/services/apiServiceHelpers.js');
      
      return {
        data: transformClientDetailsItem(detailedResponse.data),
        status: 'success'
      };
    } catch (error) {
      const errorMessage = extractAndLogError(error, 'API accept case error');
      const acceptError = new Error(errorMessage);
      acceptError.cause = error;
      throw acceptError;
    }
  }

  /**
   * Close a case (change status to completed)
   * @param {AxiosInstanceWrapper} axiosMiddleware - Axios middleware from request
   * @param {string} caseReference - Case reference number
   * @returns {Promise<ClientDetailsApiResponse>} API response with updated client details
   */
  static async closeCase(
    axiosMiddleware: AxiosInstanceWrapper,
    caseReference: string
  ): Promise<ClientDetailsApiResponse> {
    try {
      devLog(`API: POST ${API_PREFIX}/case/${caseReference}/close/`);
      const configuredAxios = configureAxiosInstance(axiosMiddleware);
      await configuredAxios.post(`${API_PREFIX}/case/${caseReference}/close/`);
      devLog(`API: Case closed successfully, fetching updated details`);

      // Re-fetch the full case details to get complete data structure
      const detailedResponse = await configuredAxios.get(`${API_PREFIX}/case/${caseReference}/detailed`);
      devLog(`API: Close case - full details: ${JSON.stringify(detailedResponse.data, null, JSON_INDENT)}`);

      // Import transformClientDetailsItem dynamically to avoid circular dependency
      const { transformClientDetailsItem } = await import('#src/services/apiServiceHelpers.js');
      
      return {
        data: transformClientDetailsItem(detailedResponse.data),
        status: 'success'
      };
    } catch (error) {
      const errorMessage = extractAndLogError(error, 'API close case error');
      const closeError = new Error(errorMessage);
      closeError.cause = error;
      throw closeError;
    }
  }

  /**
   * Reopen a case with a note explaining why
   * @param {AxiosInstanceWrapper} axiosMiddleware - Axios middleware from request
   * @param {string} caseReference - Case reference number
   * @param {string} note - Note explaining why the case is being reopened
   * @returns {Promise<ClientDetailsApiResponse>} API response
   */
  static async reopenCase(
    axiosMiddleware: AxiosInstanceWrapper,
    caseReference: string,
    note: string
  ): Promise<ClientDetailsApiResponse> {
    try {
      devLog(`API: POST ${API_PREFIX}/case/${caseReference}/reopen/`);
      const configuredAxios = configureAxiosInstance(axiosMiddleware);
      await configuredAxios.post(`${API_PREFIX}/case/${caseReference}/reopen/`, {
        notes: note
      });
      devLog(`API: Case reopened successfully`);

      return {
        data: null,
        status: 'success'
      };
    } catch (error) {
      const errorMessage = extractAndLogError(error, 'API reopen case error');
      const reopenError = new Error(errorMessage);
      reopenError.cause = error;
      throw reopenError;
    }
  }
}

export const changeCaseStateService = ChangeCaseStateService;
