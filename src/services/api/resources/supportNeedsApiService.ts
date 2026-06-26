/**
 * Client Support Needs API Service
 * Handles client support needs (adaptation details) operations
 */

import type { AxiosInstanceWrapper } from '#types/axios-instance-wrapper.js';
import type { ClientDetailsApiResponse } from '#types/api-types.js';
import { patchAndRefetch } from '../base/BaseApiService.js';
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