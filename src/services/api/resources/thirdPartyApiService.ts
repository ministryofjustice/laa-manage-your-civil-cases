/**
 * Third Party API Service
 * Handles third party contact operations
 */

import type { AxiosInstanceWrapper } from '#types/axios-instance-wrapper.js';
import type { ClientDetailsApiResponse } from '#types/api-types.js';
import { devLog, extractAndLogError } from '#src/scripts/helpers/index.js';
import { transformClientDetailsItem } from '../transforms/transformClientDetails.js';
import { configureAxiosInstance } from '../base/BaseApiService.js';
import { API_PREFIX, JSON_INDENT } from '../base/constants.js';

/**
 * Add third party contact for a case
 * @param {AxiosInstanceWrapper} axiosMiddleware - Axios middleware from request
 * @param {string} caseReference - Case reference number
 * @param {object} thirdPartyData - Third party data to add
 * @returns {Promise<ClientDetailsApiResponse>} API response with updated client details
 */
export async function addThirdPartyContact(
  axiosMiddleware: AxiosInstanceWrapper,
  caseReference: string,
  thirdPartyData: object
): Promise<ClientDetailsApiResponse> {
  try {
    devLog(`API: POST ${API_PREFIX}/case/${caseReference}/thirdparty_details/`);
    const configuredAxios = configureAxiosInstance(axiosMiddleware);
    const response = await configuredAxios.post(`${API_PREFIX}/case/${caseReference}/thirdparty_details/`, thirdPartyData);
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
export async function updateThirdPartyContact(
  axiosMiddleware: AxiosInstanceWrapper,
  caseReference: string,
  thirdPartyData: object
): Promise<ClientDetailsApiResponse> {
  try {
    devLog(`API: PATCH ${API_PREFIX}/case/${caseReference}/thirdparty_details/`);
    const configuredAxios = configureAxiosInstance(axiosMiddleware);
    const response = await configuredAxios.patch(`${API_PREFIX}/case/${caseReference}/thirdparty_details/`, thirdPartyData);
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
 * Delete third party contact for a case (soft delete)
 * @param {AxiosInstanceWrapper} axiosMiddleware - Axios middleware from request
 * @param {string} caseReference - Case reference number
 * @returns {Promise<ClientDetailsApiResponse>} API response confirming deletion
 */
export async function deleteThirdPartyContact(
  axiosMiddleware: AxiosInstanceWrapper,
  caseReference: string
): Promise<ClientDetailsApiResponse> {
  try {
    // Soft delete: PATCH with personal_details nested object and all fields cleared
    const payload = {
      personal_details: {
        title: null,
        full_name: null,
        postcode: null,
        street: null,
        mobile_phone: null,
        home_phone: '',  // Must be empty string, not null (CLA backend constraint)
        email: '',        // Must be empty string, not null (CLA backend constraint)
        safe_to_contact: null
      },
      pass_phrase: null,
      reason: null,
      personal_relationship: 'OTHER',  // Required field
      personal_relationship_note: '',
      spoke_to: null,
      no_contact_reason: null,
      organisation_name: null
    };
    
    devLog(`API: PATCH ${API_PREFIX}/case/${caseReference}/thirdparty_details/ (soft delete)`);
    const configuredAxios = configureAxiosInstance(axiosMiddleware);
    const response = await configuredAxios.patch(`${API_PREFIX}/case/${caseReference}/thirdparty_details/`, payload);
    devLog(`API: Third party soft delete response: ${JSON.stringify(response.data, null, JSON_INDENT)}`);
    
    // Re-fetch the case to get updated state
    const caseResponse = await configuredAxios.get(`${API_PREFIX}/case/${caseReference}/detailed`);
    devLog(`API: Re-fetched case after third party deletion: ${JSON.stringify(caseResponse.data, null, JSON_INDENT)}`);
    
    return {
      data: transformClientDetailsItem(caseResponse.data),
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
