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
  formatLongFormDate,
  transformContactDetails,
  transformClientSupportNeeds,
  transformThirdParty
} from '#src/scripts/helpers/index.js';

import { translateCaseStatus } from '#utils/server/caseStatusHelper.js';
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
  const apiState = safeString(item.state);
  const outcomeCode = safeOptionalString(item.outcome_code) ?? '';
  const caseStatus = translateCaseStatus(apiState, outcomeCode);
  const provider_assigned_at = formatDate(safeString(item.provider_assigned_at));
  const provider_viewed = formatDate(safeOptionalString(item.provider_viewed) ?? '');
  const provider_accepted = formatDate(safeOptionalString(item.provider_accepted) ?? '');
  const provider_closed = formatDate(safeOptionalString(item.provider_closed) ?? '');
  const outcome_code = safeOptionalString(item.outcome_code) ?? '';
  const state_note = safeOptionalString(item.state_note) ?? '';
  // Transform contact details
  const contactDetails = transformContactDetails(item.personal_details);

  // Transform client support needs
  const clientSupportNeeds = transformClientSupportNeeds(item.adaptation_details);

  // Transform third party contact
  const thirdParty = transformThirdParty(item.thirdparty_details);

  // Format dates differently for banner
  const providerClosedBanner = formatLongFormDate(safeOptionalString(item.provider_closed) ?? '');
  const providerViewedBanner = formatLongFormDate(safeOptionalString(item.provider_viewed) ?? '');

  return {
    caseReference,
    laaReference,
    caseStatus,
    provider_assigned_at,
    provider_viewed,
    providerViewedBanner,
    provider_accepted, 
    provider_closed,
    providerClosedBanner,     
    outcome_code, 
    state_note,
    ...contactDetails,
    clientSupportNeeds,
    thirdParty
  };
}
