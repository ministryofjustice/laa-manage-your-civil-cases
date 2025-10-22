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
 * API request parameters for case search
 */
export interface SearchApiParams {
  keyword: string;
  status?: string;
  page?: number;
  limit?: number;
  sortOrder?: string;
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
