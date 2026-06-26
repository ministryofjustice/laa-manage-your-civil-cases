import type { Request } from 'express';
import { apiService } from '#src/services/apiService.js';
import { createProcessedError, safeString } from '#src/scripts/helpers/index.js';
import type { ProviderDetail, ProviderSplitChoicesApiResponse } from '#types/api-types.js';

/**
 * Helper function to fetch Provider details
 * @param {Request} req Express request object
 * @param {string} caseReference Case reference number
 * @returns {Promise<ProviderDetail>} Provider details from the API
 * @throws {Error} If providerId is missing or the API call fails
 */
export async function fetchProviderNameAndDetail(req: Request, caseReference: string): Promise<ProviderDetail> {
  const { clientData } = req;

  const providerId =
    clientData && typeof clientData === 'object' && 'providerId' in clientData
      ? safeString((clientData).providerId)
      : '';

  if (!providerId) {
    throw createProcessedError(
      new Error('Missing providerId in clientData'),
      `fetching provider details, for case ${caseReference}`
    );
  }

  const providerResponse: ProviderSplitChoicesApiResponse = await apiService.getProviderChoices(req.axiosMiddleware, providerId);

  if (providerResponse.status === 'error' || providerResponse.data === null) {
    throw createProcessedError(
      new Error('Failed to fetch provider name'),
      `fetching provider details, for case ${caseReference}`
    );
  }

  return providerResponse.data;
}

/**
 * Helper function to check if the provider associated with a case has more than one category of law
 * @param {Request} req Express request object
 * @param {string} caseReference Case reference number
 * @returns {Promise<boolean>} - Returns a promise resolving to true if the provider has more than one category, false otherwise
 */
export async function hasMoreThanOneCategory(req: Request, caseReference: string): Promise<boolean> {
  const provider = await fetchProviderNameAndDetail(req, caseReference);
  return provider.law_category.length > 1;
}