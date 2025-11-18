/**
 * Client Support Needs API Service
 * Handles client support needs (adaptation details) operations
 */

import type { AxiosInstanceWrapper } from '#types/axios-instance-wrapper.js';
import type { ClientDetailsApiResponse } from '#types/api-types.js';
import { patchAndRefetch } from './base/BaseApiService.js';
import { getClientDetails } from './clientDetailsApiService.js';

/**
 * Add client support needs for a case
 * @param {AxiosInstanceWrapper} axiosMiddleware - Axios middleware from request
 * @param {string} caseReference - Case reference number
 * @param {object} clientSupportNeeds - Client support needs to add
 * @returns {Promise<ClientDetailsApiResponse>} API response with updated client details
 */
export async function addClientSupportNeeds(
  axiosMiddleware: AxiosInstanceWrapper,
  caseReference: string,
  clientSupportNeeds: object
): Promise<ClientDetailsApiResponse> {
  return await patchAndRefetch(
    axiosMiddleware,
    {
      caseReference,
      endpoint: `/case/${caseReference}/adaptation_details/`,
      payload: clientSupportNeeds,
      operation: 'add client support needs'
    }
  );
}

/**
 * Update client support needs for a case
 * @param {AxiosInstanceWrapper} axiosMiddleware - Axios middleware from request
 * @param {string} caseReference - Case reference number
 * @param {object} clientSupportNeeds - Client support needs to update
 * @returns {Promise<ClientDetailsApiResponse>} API response with updated client details
 */
export async function updateClientSupportNeeds(
  axiosMiddleware: AxiosInstanceWrapper,
  caseReference: string,
  clientSupportNeeds: object
): Promise<ClientDetailsApiResponse> {
  return await patchAndRefetch(
    axiosMiddleware,
    {
      caseReference,
      endpoint: `/case/${caseReference}/adaptation_details/`,
      payload: clientSupportNeeds,
      operation: 'update client support needs'
    }
  );
}

/**
 * Remove client support needs (soft delete via PATCH)
 * Clears all adaptation_details fields and sets no_adaptations_required to true
 * @param {AxiosInstanceWrapper} axiosMiddleware - Configured axios instance with auth
 * @param {string} caseReference - The case reference to update
 * @returns {Promise<ClientDetailsApiResponse>} Response with updated client details
 */
export async function deleteClientSupportNeeds(
  axiosMiddleware: AxiosInstanceWrapper,
  caseReference: string
): Promise<ClientDetailsApiResponse> {
  // Soft delete: PATCH with cleared fields and no_adaptations_required flag
  const clearPayload = {
    bsl_webcam: false,
    minicom: false,
    text_relay: false,
    skype_webcam: false,
    language: null,
    notes: '',
    callback_preference: false,
    no_adaptations_required: true
  };

  // Use patchAndRefetch first, then re-fetch using getClientDetails
  await patchAndRefetch(
    axiosMiddleware,
    {
      caseReference,
      endpoint: `/case/${caseReference}/adaptation_details/`,
      payload: clearPayload,
      operation: 'soft delete client support needs'
    }
  );
  
  // Re-fetch full case data to get updated state
  return await getClientDetails(axiosMiddleware, caseReference);
}
