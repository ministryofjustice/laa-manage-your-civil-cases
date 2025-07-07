/**
 * Case-related type definitions
 * 
 * Shared interfaces for case data across the application
 */

/**
 * Date of birth object structure used in fixture data
 */
export interface DateOfBirth {
  day: string;
  month: string;
  year: string;
}

/**
 * Case data structure for display and client-side operations
 */
export interface CaseData {
  fullName: string;
  caseReference: string;
  refCode: string;
  dateReceived: string;
  caseStatus: string;
  dateOfBirth: string;
  lastModified?: string;
  dateClosed?: string;
}

/**
 * Raw case data structure from fixtures (before transformation)
 */
export interface CaseDataRaw {
  fullName: string;
  caseReference: string;
  refCode: string;
  dateReceived: string;
  caseStatus: string;
  dateOfBirth: DateOfBirth;
  lastModified?: string;
  dateClosed?: string;
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
