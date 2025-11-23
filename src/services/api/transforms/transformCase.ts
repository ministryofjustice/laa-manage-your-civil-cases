/**
 * Transform Case Data
 * Transforms raw CLA API case items to display format
 */

import type { CaseData } from '#types/case-types.js';
import {
  safeString,
  safeOptionalString,
  isRecord,
  formatDate
} from '#src/scripts/helpers/index.js';

/**
 * Transform raw case item from CLA API to display format
 * @param {unknown} item Raw case item from CLA API
 * @returns {CaseData} Transformed case item
 */
export function transformCaseItem(item: unknown): CaseData {
  if (!isRecord(item)) {
    throw new Error('Invalid case item: expected object');
  }

  return {
    fullName: safeString(item.full_name),
    caseReference: safeString(item.reference),
    laaReference: safeString(item.laa_reference),
    refCode: safeString(item.reference),
    provider_assigned_at: formatDate(safeString(item.provider_assigned_at)),
    provider_viewed: formatDate(safeOptionalString(item.provider_viewed) ?? ''), 
    provider_accepted: formatDate(safeOptionalString(item.provider_accepted) ?? ''),
    outcome_code: safeOptionalString(item.outcome_code) ?? '',
    caseStatus: safeString(item.caseStatus),
    dateOfBirth: formatDate(safeString(item.date_of_birth)),
    modified: formatDate(safeOptionalString(item.modified) ?? ''),
    provider_closed: formatDate(safeOptionalString(item.provider_closed) ?? ''),
    phoneNumber: safeOptionalString(item.phone_number),
    safeToCall: Boolean(item.safe_to_call),
    announceCall: Boolean(item.announce_call),
    emailAddress: safeOptionalString(item.email_address),
    clientIsVulnerable: Boolean(item.client_is_vulnerable),
    address: safeOptionalString(item.address),
    postcode: safeOptionalString(item.postcode)
  };
}

/**
 * Transform raw case item from CLA API to display format in Search results
 * @param {unknown} item Raw case item from CLA API
 * @returns {CaseData} Transformed case item
 */
export function transformCaseItemForSearch(item: unknown): CaseData {
  if (!isRecord(item)) {
    throw new Error('Invalid case item: expected object');
  }

  // TODO add state to the Search endpoint response, so we can remove `determineCaseStatus` and maybe even `transformCaseItemForSearch`
  /**
   * Determine case status from CLA API fields for the Search endpoint
   * @param {Record<string, unknown>} item - Case item from API
   * @returns {string} Readable case status
   */
  function determineCaseStatus(item: Record<string, unknown>): string {
  const viewed = Boolean(item.provider_viewed);
  const accepted = Boolean(item.provider_accepted);
  const closed = Boolean(item.provider_closed);
  const outcomeCode = item.outcome_code === "CLSP";

  if (closed) {
    return outcomeCode ? "Completed" : "Closed";
  }
  if (accepted) {
    return 'Advising';
  }
  if (viewed) {
    return 'Pending';
  }
  return 'New';
}

  return {
    fullName: safeString(item.full_name),
    caseReference: safeString(item.reference),
    laaReference: safeString(item.laa_reference),
    refCode: safeString(item.reference),
    phoneNumber: safeOptionalString(item.phone_number),
    dateOfBirth: formatDate(safeString(item.date_of_birth)),
    caseStatus: determineCaseStatus(item),
    provider_assigned_at: formatDate(safeString(item.provider_assigned_at)),
    modified: formatDate(safeOptionalString(item.modified) ?? ''),
  };
}
