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
  caseType: 'new' | 'accepted' | 'opened' | 'closed';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  filters?: Record<string, unknown>;
}

/**
 * Client details API response interface
 */
export interface ClientDetailsResponse {
  caseReference: string;
  fullName: string;
  dateOfBirth: string;
  [key: string]: unknown; // Allow for additional fields
}

/**
 * Raw client details interface (for editing) - preserves ISO date format
 */
export interface RawClientDetailsResponse {
  caseReference: string;
  fullName: string;
  dateOfBirth: string; // ISO format: YYYY-MM-DD
  [key: string]: unknown; // Allow for additional fields
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
 * API response interface for raw client details (for editing)
 */
export interface RawClientDetailsApiResponse {
  data: RawClientDetailsResponse | null;
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
 * Client details update interface
 */
export interface ClientDetailsUpdate {
  dateOfBirth?: string;
  [key: string]: unknown; // Allow for future additional fields
}
