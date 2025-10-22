/**
 * Case-related type definitions
 *
 * Shared interfaces for case data across the application
 */


/**
 * Case data structure for display and client-side operations
 */
export interface CaseData {
  full_name: string;
  reference: string;
  outcome_code: string;
  outcome_description?: string;
  provider_assigned_at: string; // received date
  case_status: string;
  date_of_birth: string;
  modified?: string;
  provider_closed?: string;
  // Client contact details
  phoneNumber?: string;
  safeToCall?: boolean;
  announceCall?: boolean;
  emailAddress?: string;
  // Client information
  clientIsVulnerable?: boolean;
  address?: string;
  postcode?: string;
  specialNotes?: string;
  // New fields from updated API response
  laaReference?: number;
  provider_viewed?: string;
  provider_accepted?: string;
  is_urgent?: boolean;
}

/**
 * Raw case data structure from API (before transformation)
 */
export interface CaseDataRaw {
  reference: string;
  created: string;
  modified: string;
  full_name: string;
  laa_reference: number;
  eligibility_state: string;
  personal_details: string;
  requires_action_by: string;
  postcode: string;
  diagnosis_state: string;
  date_of_birth: string;
  category: string;
  outcome_code: string;
  outcome_description: string;
  case_count: number;
  provider_viewed: string | null;
  provider_accepted: string | null;
  provider_closed: string | null;
  provider_assigned_at: string;
  is_urgent: boolean;
}

/**
 * Options for loading case data
 */
export interface CaseLoadOptions {
  caseType: 'new' | 'accepted' | 'opened' | 'closed';
  sortOrder: 'asc' | 'desc';
}

/**
 * Case status types
 */
export type CaseStatus = 'New' | 'Accepted' | 'Opened' | 'Closed';

/**
 * Case reference code types
 */
export type CaseRefCode = '' | 'Manually allocated by operator' | 'Operator recommends second opinion' | 'Out of scope for CLA' | 'Duplicate of existing case' | 'Not financially eligible for CLA' | 'Split from another case';
