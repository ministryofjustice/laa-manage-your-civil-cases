/**
 * MSW Test Utilities
 * 
 * Helper functions for common MSW test scenarios and operations.
 * Provides utilities for test setup, handler overrides, and verification.
 */

import { http, HttpResponse } from 'msw';
import { server } from './setup.js';

/**
 * Override specific handlers for individual tests
 * Useful for testing error scenarios or specific data conditions
 * 
 * @param {any[]} handlers - Array of MSW handlers to add for this test
 * 
 * @example
 * ```typescript
 * test('handles API error', async ({ page }) => {
 *   overrideHandlers([
 *     http.get('/latest/mock/cases/:caseRef', () => {
 *       return HttpResponse.json({ error: 'Not found' }, { status: 404 });
 *     })
 *   ]);
 *   
 *   // Test error handling
 * });
 * ```
 */
export function overrideHandlers(handlers: any[]): void {
  server.use(...handlers);
}

/**
 * Create a mock error response for testing error scenarios
 * 
 * @param {number} status - HTTP status code
 * @param {string} message - Error message
 * @returns {HttpResponse} MSW HttpResponse with error
 */
export function createErrorResponse(status: number, message: string) {
  return HttpResponse.json(
    { 
      error: message,
      timestamp: new Date().toISOString(),
      status
    }, 
    { status }
  );
}

/**
 * Create a mock client details response with custom data
 * 
 * @param {string} caseReference - Case reference number
 * @param {Partial<any>} overrides - Custom data to override defaults
 * @returns {object} Mock client details object
 */
export function createMockClientDetails(
  caseReference: string, 
  overrides: Partial<any> = {}
) {
  return {
    caseReference,
    fullName: 'Test Client',
    phoneNumber: '+44 7700 900123',
    emailAddress: 'test@example.com',
    address: '123 Test Street',
    postcode: 'TEST 123',
    dateOfBirth: '1990-01-01T00:00:00.000Z',
    caseStatus: 'Accepted',
    clientIsVulnerable: false,
    language: 'English',
    ...overrides
  };
}

/**
 * Create a mock pagination response with headers
 * 
 * @param {any[]} data - Array of data items
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} total - Total number of items
 * @returns {HttpResponse} HttpResponse with pagination headers
 */
export function createPaginatedResponse(
  data: any[], 
  page = 1, 
  limit = 20, 
  total: number = data.length
) {
  const totalPages = Math.ceil(total / limit);
  
  return HttpResponse.json(data, {
    headers: {
      'x-total-count': total.toString(),
      'x-page': page.toString(),
      'x-per-page': limit.toString(),
      'x-total-pages': totalPages.toString()
    }
  });
}

/**
 * Request logging utility for debugging
 * Logs details about intercepted requests
 * 
 * @param {Request} request - Request object from MSW handler
 * @param {string} context - Additional context information
 * @returns {void}
 */
export function logRequest(request: Request, context = ''): void {
  // Debug logging disabled
}

/**
 * Verify that specific endpoints were called during test
 * Note: This is a placeholder for Phase 6 (Coverage Tracking)
 * 
 * @param {string[]} endpoints - Array of endpoint patterns to check
 * @returns {object} Object with coverage information
 */
export function getEndpointCoverage(endpoints: string[]): object {
  // Placeholder implementation
  // Will be implemented in Phase 6: Coverage Tracking
  return {
    covered: endpoints,
    total: endpoints.length,
    percentage: 100
  };
}
