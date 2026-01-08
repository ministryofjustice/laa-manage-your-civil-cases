/**
 * Utility functions for MSW handlers
 */

import type { MockCase } from './types.js';

/**
 * In-memory state tracking for case updates during tests
 * Maps caseReference to partial case updates
 */
const caseStateUpdates = new Map<string, Partial<MockCase>>();

/**
 * Reset case state updates (call in beforeEach hook)
 */
export function resetMockCaseState(): void {
  console.log('[MSW] resetMockCaseState() called - clearing', caseStateUpdates.size, 'state updates');
  caseStateUpdates.forEach((value, key) => {
    console.log(`[MSW]   - ${key}: ${JSON.stringify(value)}`);
  });
  caseStateUpdates.clear();
  console.log('[MSW] State cleared, Map size now:', caseStateUpdates.size);
}

/**
 * Update case state
 */
export function updateCaseState(caseReference: string, updates: Partial<MockCase>): void {
  const existing = caseStateUpdates.get(caseReference) || {};
  caseStateUpdates.set(caseReference, { ...existing, ...updates });
}

/**
 * Find mock case with state updates applied
 */
export function findMockCase(caseReference: string, cases: MockCase[]): MockCase | undefined {
  const baseCase = cases.find(c => c.caseReference === caseReference);
  if (!baseCase) return undefined;
  
  const updates = caseStateUpdates.get(caseReference);
  return updates ? { ...baseCase, ...updates } : baseCase;
}

/**
 * Map boolean safe to call value to CLA API format
 * @param {boolean} booleanValueTrue - Whether it's safe to call
 * @returns {string} 'SAFE' or 'DONT_CALL'
 */
const mapSafe = (booleanValueTrue?: boolean) => (booleanValueTrue ? 'SAFE' : 'DONT_CALL');

/**
 * Transform mock case data to CLA API format (snake_case with nested objects)
 * @param {MockCase} caseItem - Mock case data
 * @returns {object} Case data in CLA API format
 */
export function transformToApiFormat(caseItem: MockCase): object {
  return {
    reference: caseItem.caseReference,
    laa_reference: caseItem.laaReference,
    full_name: caseItem.fullName,
    date_of_birth: caseItem.dateOfBirth,
    // Real CLA API returns lowercase state names (e.g., "accepted", "opened", "closed")
    state: caseItem.caseStatus.toLowerCase(),
    provider_assigned_at: caseItem.dateReceived,
    modified: caseItem.lastModified || caseItem.dateReceived,
    provider_closed: caseItem.dateClosed || null,
    // Personal details nested object
    personal_details: {
      full_name: caseItem.fullName,
      date_of_birth: caseItem.dateOfBirth,
      home_phone: caseItem.phoneNumber,
      mobile_phone: caseItem.phoneNumber,
      safe_to_contact: mapSafe(caseItem.safeToCall),
      announce_call: caseItem.announceCall,
      email: caseItem.emailAddress,
      street: caseItem.address,
      postcode: caseItem.postcode
    },
    // Adaptation details nested object
    adaptation_details: caseItem.clientSupportNeeds ? {
      bsl_webcam: caseItem.clientSupportNeeds.bslWebcam === 'Yes',
      minicom: caseItem.clientSupportNeeds.textRelay === 'Yes',
      text_relay: caseItem.clientSupportNeeds.textRelay === 'Yes',
      skype_webcam: caseItem.clientSupportNeeds.skype === true, 
      callback_preference: caseItem.clientSupportNeeds.callbackPreference === 'Yes',
      language: caseItem.clientSupportNeeds.languageSupportNeeds || null,
      notes: caseItem.clientSupportNeeds.notes || null
    } : {
      // Provide empty structure when no client support needs
      bsl_webcam: false,
      minicom: false,
      text_relay: false,
      skype_webcam: false,
      callback_preference: false,
      no_adaptations_required: true, 
      language: null,
      notes: null
    },
    // Third party details nested object
    thirdparty_details: caseItem.thirdParty ? {
      personal_details: {
        full_name: caseItem.thirdParty.fullName,
        email: caseItem.thirdParty.emailAddress,
        mobile_phone: caseItem.thirdParty.contactNumber,
        safe_to_contact: mapSafe(caseItem.thirdParty.safeToCall),
        street: caseItem.thirdParty.address,
        postcode: caseItem.thirdParty.postcode
      },
      personal_relationship: caseItem.thirdParty.relationshipToClient?.selected?.[0] || 'PARENT_GUARDIAN',
      personal_relationship_note: null,
      spoke_to: true,
      no_contact_reason: caseItem.thirdParty.passphraseSetUp?.selected?.[0] || 'OTHER',
      organisation_name: null,
      reason: caseItem.thirdParty.passphraseSetUp?.selected?.[0] || 'OTHER',
      pass_phrase: caseItem.thirdParty.passphraseSetUp?.passphrase || null
    } : null
  };
}

/**
 * Filter cases by status type
 * @param {string} status - The status to filter by
 * @param {MockCase[]} cases - Array of all cases
 * @returns {MockCase[]} Array of filtered cases
 */
export function filterCasesByStatus(status: string, cases: MockCase[]): MockCase[] {
  const statusMap: Record<string, string[]> = {
    'new': ['New'],
    'accepted': ['Accepted'],
    'opened': ['Opened'],
    'rejected': ['Closed'],
    'completed': ['Closed']
  };

  const validStatuses = statusMap[status] || [];
  return cases.filter(caseItem => validStatuses.includes(caseItem.caseStatus));
}

/**
 * Paginate results
 * @param {MockCase[]} data - Array of cases to paginate
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Items per page (default: 20)
 * @returns {object} Object containing paginated data and pagination metadata
 */
export function paginateResults(data: MockCase[], page = 1, limit = 20) {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  return {
    data: data.slice(startIndex, endIndex),
    pagination: {
      total: data.length,
      page,
      limit,
      totalPages: Math.ceil(data.length / limit)
    }
  };
}
