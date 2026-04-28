/**
 * Transform Case Data
 * Transforms raw CLA API case items to display format
 */

import type { CaseData } from '#types/case-types.js';
import {
  safeString,
  safeOptionalString,
  isRecord,
  formatDate,
  formatLongFormDateWithShortMonth,
  isSafeToCall
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

  const mcc_case_flags = isRecord(item.mcc_case_flags) ? item.mcc_case_flags : {};

  return {
    fullName: safeString(item.full_name),
    caseReference: safeString(item.reference),
    laaReference: safeString(item.laa_reference),
    refCode: safeString(item.reference),
    provider_assigned_at: formatLongFormDateWithShortMonth(safeString(item.provider_assigned_at)),
    provider_viewed: formatLongFormDateWithShortMonth(safeOptionalString(item.provider_viewed) ?? ''),
    provider_accepted: formatLongFormDateWithShortMonth(safeOptionalString(item.provider_accepted) ?? ''),
    outcome_code: safeOptionalString(item.outcome_code) ?? '',
    caseStatus: determineCaseStatus(item),
    dateOfBirth: formatDate(safeString(item.date_of_birth)),
    modified: formatLongFormDateWithShortMonth(safeOptionalString(item.modified) ?? ''),
    provider_closed: formatLongFormDateWithShortMonth(safeOptionalString(item.provider_closed) ?? ''),
    phoneNumber: safeOptionalString(item.phone_number),
    safeToCall: Boolean(item.safe_to_contact),
    announceCall: Boolean(item.announce_call),
    postcode: safeOptionalString(item.postcode),
    isUrgent: Boolean(item.is_urgent),
    textRelay: Boolean(mcc_case_flags.text_relay),
    bslWebcam: Boolean(mcc_case_flags.bsl_webcam),
    thirdpartyDetails: Boolean(mcc_case_flags.thirdparty_details),
    vulnerableUser: safeOptionalString(mcc_case_flags.vulnerable_user),
    language: safeOptionalString(mcc_case_flags.language)
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

  return {
    fullName: safeString(item.full_name),
    caseReference: safeString(item.reference),
    laaReference: safeString(item.laa_reference),
    refCode: safeString(item.reference),
    phoneNumber: safeOptionalString(item.phone_number),
    dateOfBirth: formatDate(safeString(item.date_of_birth)),
    caseStatus: determineCaseStatus(item),
    provider_assigned_at: formatLongFormDateWithShortMonth(safeString(item.provider_assigned_at)),
    modified: formatLongFormDateWithShortMonth(safeOptionalString(item.modified) ?? ''),
    safeToCall: isSafeToCall({ safe_to_contact: item.safe_to_contact}),
  };
}

// TODO add state to the Search & `\case` endpoint response, so we can remove `determineCaseStatus` and maybe even `transformCaseItemForSearch`
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