/**
 * Transform Client Details
 * Transforms raw CLA API client details to display format
 */

import type { ClientDetailsResponse } from '#types/api-types.js';
import {
  safeString,
  safeOptionalString,
  isRecord,
  formatDate,
  transformContactDetails,
  transformClientSupportNeeds,
  transformThirdParty
} from '#src/scripts/helpers/index.js';

/**
 * Transform raw client details item to display format
 * Maps nested API structures (personal_details, adaptation_details, thirdparty_details)
 * @param {unknown} item Raw client details item
 * @returns {ClientDetailsResponse} Transformed client details item
 */
export function transformClientDetailsItem(item: unknown): ClientDetailsResponse {
  if (!isRecord(item)) {
    throw new Error('Invalid client details item: expected object');
  }

  // Extract top-level client information
  const caseReference = safeString(item.reference);
  const laaReference = safeString(item.laa_reference);
  const caseStatus = safeString(item.state);

  // eslint-disable-next-line @typescript-eslint/naming-convention -- `provider_assigned_at` matches API response field
  const provider_assigned_at = formatDate(safeString(item.provider_assigned_at));
  // eslint-disable-next-line @typescript-eslint/naming-convention -- `provider_viewed` matches API response field
  const provider_viewed = formatDate(safeOptionalString(item.provider_viewed) ?? '');
  // eslint-disable-next-line @typescript-eslint/naming-convention -- `provider_accepted` matches API response field
  const provider_accepted = formatDate(safeOptionalString(item.provider_accepted) ?? '');
  // eslint-disable-next-line @typescript-eslint/naming-convention -- `provider_closed` matches API response field
  const provider_closed = formatDate(safeOptionalString(item.provider_closed) ?? '');
  // eslint-disable-next-line @typescript-eslint/naming-convention -- `outcome_code` matches API response field
  const outcome_code = safeOptionalString(item.outcome_code) ?? '';
  // Transform contact details
  const contactDetails = transformContactDetails(item.personal_details);

  // Transform client support needs
  const clientSupportNeeds = transformClientSupportNeeds(item.adaptation_details);

  // Transform third party contact
  const thirdParty = transformThirdParty(item.thirdparty_details);

  return {
    caseReference,
    laaReference,
    caseStatus,
    provider_assigned_at,
    provider_viewed,
    provider_accepted, 
    provider_closed,     
    outcome_code, 
    ...contactDetails,
    clientSupportNeeds,
    thirdParty
  };
}
