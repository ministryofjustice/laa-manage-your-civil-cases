/**
 * Case-related type definitions
 *
 * Shared interfaces for case data across the application
 */


/**
 * Case data structure for display and client-side operations
 */
export interface CaseData {
  fullName: string;
  laaReference: string;
  caseReference: string;
  refCode: string;
  provider_assigned_at: string;
  provider_viewed?: string;
  provider_accepted?: string;
  outcome_code?: string; 
  caseStatus: string;
  dateOfBirth: string;
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
  outcomeDescription?: string;
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
