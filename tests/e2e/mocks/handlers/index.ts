/**
 * MSW Handlers Index
 * 
 * Composes all domain-specific handlers into a single array for MSW server.
 * Following MSW best practices for modular handler organization.
 * 
 * @see https://mswjs.io/docs/best-practices/structuring-handlers
 */

import { http, HttpResponse } from 'msw';

// Import the actual API handlers
import { apiHandlers } from './api.js';

/**
 * Combined handlers array
 * Using the comprehensive API handlers that match the application's real API calls
 */
export const handlers = [
  ...apiHandlers,
  
  // Health check endpoint for testing
  http.get('/health', () => {
    return HttpResponse.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      msw: 'active'
    });
  })
];

console.log('📦 MSW handlers loaded:', handlers.length);
