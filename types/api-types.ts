/**
 * API Types
 * 
 * This file contains all TypeScript interfaces and types related to API requests and responses.
 * These types are used across different services and components for consistent API interactions.
 */

/**
 * Pagination metadata interface
 */
export interface PaginationMeta {
  total: number | null;
  page: number;
  limit: number;
  totalPages?: number;
}

/**
 * API response interface with pagination
 */
export interface ApiResponse<T> {
  data: T[];
  pagination: PaginationMeta;
  status: 'success' | 'error';
  message?: string;
}

/**
 * API request parameters for cases
 */
export interface CaseApiParams {
  caseType: 'new' | 'accepted' | 'opened' | 'rejected' | 'completed';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  filters?: Record<string, unknown>;
}

/**
 * API request parameters for case search
 */
export interface SearchApiParams {
  keyword: string;
  status?: string;
  page?: number;
  pageSize?: number;
  sortOrder?: string;
  sortBy?: string
}

/**
 * Client support needs (transformed from adaptation_details)
 */
export interface ClientSupportNeeds {
  bslWebcam: string;
  textRelay: string;
  callbackPreference: string;
  languageSupportNeeds: string;
  notes: string;
  no_adaptations_required: boolean;
}

/**
 * Third party contact (transformed from thirdparty_details)
 */
export interface ThirdPartyContact {
  fullName: string;
  contactNumber: string;
  safeToCall: boolean;
  emailAddress: string;
  address: string;
  postcode: string;
  relationshipToClient: string;
  noContactReason: string;
  passphrase: string;
  isSoftDeleted: boolean;
}

/**
 * Scope Traversal (transformed from scope_traversal)
 */
export interface ScopeTraversal {
  category: string;
  subCategory: string;
  onwardQuestion: Array<{
    question: string;
    answer: string;
  }>;
  financialAssessmentStatus: string;
  created: string;
}

/**
 * Diagnosis (transformed from diagnosis)
 */
export interface Diagnosis {
  category: string;
  diagnosisNode: Array<{node: string;}>;
}

/**
 * Notes history (transformed from notes_history)
 */
export interface NotesHistory {
  createdBy: string;
  created: string;
  providerNotes: string;
}

/**
 * Client details API response interface
 */
export interface ClientDetailsResponse {
  //About the client
  caseReference: string;
  fullName: string;
  dateOfBirth: string;
  caseStatus: string;
  provider_assigned_at: string;
  provider_viewed?: string;
  provider_accepted?: string;
  provider_closed?: string;
  outcome_code?: string;
  state_note?: string;
  client_notes?: string;
  operatorNotes?: string;
  
  //Contact details
  phoneNumber: string;
  safeToCall: boolean;
  announceCall: boolean;
  emailAddress: string;
  address: string;
  postcode: string;
  
  //Client support needs (null if not present)
  clientSupportNeeds: ClientSupportNeeds | null;
  
  //Third party contact (null if not present)
  thirdParty: ThirdPartyContact | null;

  //Scope traversal (null if not present)
  scopeTraversal: ScopeTraversal | null;

  //Diagnosis (null if not present)
  diagnosis: Diagnosis | null;

  //Notes history (null if not present)
  notesHistory: NotesHistory[];
  
  // Allow additional fields for debugging
  [key: string]: unknown;
}

/**
 * API response interface for single client details
 */
export interface ClientDetailsApiResponse {
  data: ClientDetailsResponse | null;
  status: 'success' | 'error';
  message?: string;
}

/**
 * Base API response interface for generic responses
 */
export interface BaseApiResponse {
  status: 'success' | 'error';
  message?: string;
}

/**
 * API error response interface
 */
export interface ApiErrorResponse extends BaseApiResponse {
  status: 'error';
  message: string;
  errorCode?: string;
  details?: Record<string, unknown>;
}

/**
 * API success response interface
 */
export interface ApiSuccessResponse<T = unknown> extends BaseApiResponse {
  status: 'success';
  data: T;
}

/**
 * CLA API search response interface
 */
export interface ClaSearchApiResponse {
  results: unknown[];
  count: number;
}

/**
 * Client history details API response interface
 */
export interface ClientHistoryLogItem {
  code: string;
  createdBy: string;
  created: string;
  notes: string;
}

/**
 * API response interface for single client history details
 */
export interface ClientHistoryApiResponse {
  data: ClientHistoryLogItem[] | null;
  status: 'success' | 'error';
  message?: string;
}

/**
 * Feedback choice interface from API OPTIONS response
 */
export interface FeedbackChoice {
  display_name: string;
  value: string;
}

/**
 * Feedback choices API response interface
 */
export interface FeedbackChoicesApiResponse {
  data: FeedbackChoice[] | null;
  status: 'success' | 'error';
  message?: string;
}

/**
 * Feedback submission request body
 */
export interface FeedbackSubmissionRequest {
  issue: string;
  comment: string;
}

/**
 * Feedback submission API response interface
 */
export interface FeedbackSubmissionApiResponse {
  data: unknown | null;
  status: 'success' | 'error';
  message?: string;
}