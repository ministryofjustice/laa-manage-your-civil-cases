/**
 * API Service
 *
 * This service provides a mock API interface for development using fixture data.
 * Designed to be easily replaceable with real API endpoints when backend is ready.
 *
 * Usage examples:
 * ```typescript
 * // Get cases with sorting
 * const cases = await getCases('new', 'desc');
 * 
 * // Direct API service usage
 * const response = await apiService.getCases({ caseType: 'new', sortOrder: 'desc' });
 * ```
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { setTimeout as delay } from 'timers/promises';
import type { CaseData, DateOfBirth } from '#types/case-types.js';
import {
  isValidDateOfBirth,
  safeString,
  safeOptionalString,
  isRecord
} from '#src/scripts/helpers/dataTransformers.js';

// Constants
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = parseInt(process.env.PAGINATION_LIMIT ?? '20', 10); // Configurable via env
const MOCK_DELAY = 50;
const ZERO_TOTAL = 0;
const MIN_PAGE_VALUE = 1;

/**
 * API response structure that matches expected backend format
 */
export interface ApiResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
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
 * Transform dateOfBirth object to string format (DD MMM YYYY)
 * @param {DateOfBirth} dateOfBirth DateOfBirth object
 * @returns {string} Formatted date string
 */
function transformDateOfBirth(dateOfBirth: DateOfBirth): string {
  const { day, month, year } = dateOfBirth;
  return `${day} ${month} ${year}`;
}

/**
 * Transform raw case item to display format
 * @param {unknown} item Raw case item
 * @returns {CaseData} Transformed case item
 */
function transformCaseItem(item: unknown): CaseData {
  if (!isRecord(item)) {
    throw new Error('Invalid case item: expected object');
  }

  const { dateOfBirth: dateOfBirthValue } = item;

  return {
    fullName: safeString(item.fullName),
    caseReference: safeString(item.caseReference),
    refCode: safeString(item.refCode),
    dateReceived: safeString(item.dateReceived),
    caseStatus: safeString(item.caseStatus),
    dateOfBirth: isValidDateOfBirth(dateOfBirthValue) ? transformDateOfBirth(dateOfBirthValue) : '',
    lastModified: safeOptionalString(item.lastModified),
    dateClosed: safeOptionalString(item.dateClosed)
  };
}

/**
 * Mock API Service that loads data from fixtures
 * TODO: Replace with real API service when backend is ready
 */
class MockApiService {
  /**
   * Load mock data from JSON fixtures
   * @param {string} caseType Type of case
   * @param {'asc' | 'desc'} sortOrder Sort order
   * @returns {unknown[]} Raw fixture data
   */
  private static loadMockData(caseType: string, sortOrder: 'asc' | 'desc'): unknown[] {
    try {
      const filePath = join(process.cwd(), `tests/fixtures/cases/${caseType}`, `data-${sortOrder}.json`);
      const fileContent = readFileSync(filePath, 'utf-8');
      const data: unknown = JSON.parse(fileContent);

      if (!Array.isArray(data)) {
        console.error('Invalid mock data format: expected array');
        return [];
      }

      return data;
    } catch (error) {
      console.error('Error loading mock data:', error);
      return [];
    }
  }

  /**
   * Simulate network delay using setTimeout
   * @param {number} ms - Delay in milliseconds (defaults to MOCK_DELAY)
   * @returns {Promise<void>} Promise that resolves after delay
   */
  private static async mockDelay(ms = MOCK_DELAY): Promise<void> {
    await delay(ms);
  }

  /**
   * Create success response
   * @param {CaseData[]} data - Case data
   * @param {CaseApiParams} params - API parameters
   * @returns {ApiResponse<CaseData>} Success response
   */
  private static createSuccessResponse(data: CaseData[], params: CaseApiParams): ApiResponse<CaseData> {
    const { sortBy = 'dateReceived', sortOrder = 'asc' } = params;
    const page = params.page ?? DEFAULT_PAGE;
    const limit = params.limit ?? DEFAULT_LIMIT;

    const startIndex = (page - DEFAULT_PAGE) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = data.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      meta: {
        total: data.length,
        page,
        limit,
        sortBy,
        sortOrder
      },
      status: 'success'
    };
  }

  /**
   * Create error response
   * @param {CaseApiParams} params - API parameters
   * @param {string} message - Error message
   * @returns {ApiResponse<CaseData>} Error response
   */
  private static createErrorResponse(params: CaseApiParams, message: string): ApiResponse<CaseData> {
    return {
      data: [],
      meta: {
        total: ZERO_TOTAL,
        page: params.page ?? DEFAULT_PAGE,
        limit: params.limit ?? DEFAULT_LIMIT,
        sortBy: params.sortBy ?? 'dateReceived',
        sortOrder: params.sortOrder ?? 'asc'
      },
      status: 'error',
      message
    };
  }

  /**
   * Get cases data with API-like interface
   * @param {CaseApiParams} params API parameters
   * @returns {Promise<ApiResponse<CaseData>>} API response
   */
  static async getCases(params: CaseApiParams): Promise<ApiResponse<CaseData>> {
    try {
      await MockApiService.mockDelay();

      const { caseType, sortBy = 'dateReceived', sortOrder = 'asc' } = params;
      const page = params.page ?? DEFAULT_PAGE;
      const limit = params.limit ?? DEFAULT_LIMIT;

      console.log(`Mock API: GET /cases/${caseType}?sortBy=${sortBy}&sortOrder=${sortOrder}&page=${page}&limit=${limit}`);

      const rawData = MockApiService.loadMockData(caseType, sortOrder);
      const transformedData = rawData.map(transformCaseItem);

      console.log(`Mock API: Returning ${transformedData.length} ${caseType} cases`);

      return MockApiService.createSuccessResponse(transformedData, params);

    } catch (error) {
      console.error('Mock API error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return MockApiService.createErrorResponse(params, message);
    }
  }
}

// Export the mock API service
export const apiService = MockApiService;

/**
 * Convenience function to get cases with proper typing
 * @param {string} caseType Type of case (new, accepted, opened, closed)
 * @param {'asc' | 'desc'} sortOrder Sort order
 * @returns {Promise<CaseData[]>} Promise resolving to case data
 */
export async function getCases(caseType: string, sortOrder: 'asc' | 'desc' = 'asc'): Promise<CaseData[]> {
  const validCaseTypes = ['new', 'accepted', 'opened', 'closed'] as const;
  type ValidCaseType = typeof validCaseTypes[number];

  /**
   * Type guard to check if case type is valid
   * @param {string} type Case type to validate
   * @returns {boolean} True if valid case type
   */
  const isValidCaseType = (type: string): type is ValidCaseType =>
    (validCaseTypes as readonly string[]).includes(type);

  if (!isValidCaseType(caseType)) {
    console.error(`Invalid case type: ${caseType}`);
    return [];
  }

  const response = await apiService.getCases({
    caseType,
    sortOrder,
    sortBy: 'dateReceived'
  });

  if (response.status === 'error') {
    console.error(`Error loading ${caseType} cases:`, response.message);
    return [];
  }

  return response.data;
}

/**
 * Pagination utility functions
 */
export const PaginationConfig = {
  DEFAULT_PAGE_SIZE: DEFAULT_LIMIT,
  
  /**
   * Create pagination parameters
   * @param {number} page - Page number (1-based)
   * @param {number} pageSize - Items per page
   * @returns {Pick<CaseApiParams, 'page' | 'limit'>} Pagination params
   */
  createParams(page = DEFAULT_PAGE, pageSize = DEFAULT_LIMIT): Pick<CaseApiParams, 'page' | 'limit'> {
    return {
      page: Math.max(MIN_PAGE_VALUE, page),
      limit: Math.max(MIN_PAGE_VALUE, pageSize)
    };
  },

  /**
   * Calculate pagination metadata
   * @param {number} total - Total items
   * @param {number} page - Current page
   * @param {number} limit - Items per page
   * @returns {object} Pagination metadata
   */
  calculateMeta(total: number, page: number, limit: number) {
    const totalPages = Math.ceil(total / limit);
    return {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > MIN_PAGE_VALUE,
      startItem: (page - MIN_PAGE_VALUE) * limit + MIN_PAGE_VALUE,
      endItem: Math.min(page * limit, total)
    };
  }
};
