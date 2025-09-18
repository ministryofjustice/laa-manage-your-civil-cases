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
 * @param handlers - Array of MSW handlers to add for this test
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
 * @param status - HTTP status code
 * @param message - Error message
 * @returns MSW HttpResponse with error
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
 * @param caseReference - Case reference number
 * @param overrides - Custom data to override defaults
 * @returns Mock client details object
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
 * @param data - Array of data items
 * @param page - Current page number
 * @param limit - Items per page
 * @param total - Total number of items
 * @returns HttpResponse with pagination headers
 */
export function createPaginatedResponse(
  data: any[], 
  page: number = 1, 
  limit: number = 20, 
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
 * @param request - Request object from MSW handler
 * @param context - Additional context information
 */
export function logRequest(request: Request, context: string = ''): void {
  // Debug logging disabled
}

/**
 * Verify that specific endpoints were called during test
 * Note: This is a placeholder for Phase 6 (Coverage Tracking)
 * 
 * @param endpoints - Array of endpoint patterns to check
 * @returns Object with coverage information
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
