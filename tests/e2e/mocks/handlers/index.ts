/**
 * MSW Handlers Index
 * 
 * Composes all domain-specific handlers into a single array for MSW server.
 * Following MSW best practices for modular handler organization.
 * 
 * @see https://mswjs.io/docs/best-practices/structuring-handlers
 */

import { http, HttpResponse } from 'msw';

// Domain-specific handlers (to be created in Phase 2)
// import { casesHandlers } from './cases.js';
// import { clientDetailsHandlers } from './client-details.js';
// import { searchHandlers } from './search.js';
// import { thirdPartyHandlers } from './third-party.js';

/**
 * Temporary basic handlers for Phase 1 testing
 * These will be replaced with proper domain handlers in Phase 2
 */
const temporaryHandlers = [
  // Basic health check endpoint
  http.get('/health', () => {
    return HttpResponse.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      msw: 'active'
    });
  }),

  // Temporary client details handler for integration testing
  http.get('/latest/mock/cases/:caseReference', ({ params }) => {
    console.log('🎯 MSW intercepted client details request for case:', params.caseReference);
    
    return HttpResponse.json({
      caseReference: params.caseReference,
      fullName: 'MSW Test Client',
      phoneNumber: '+44 7700 900123',
      emailAddress: 'msw.test@example.com',
      address: '123 MSW Test Street',
      postcode: 'MSW 123',
      dateOfBirth: '1990-01-01T00:00:00.000Z',
      caseStatus: 'Accepted',
      clientIsVulnerable: false,
      language: 'English',
      reasonableAdjustments: {
        selected: [],
        available: [
          'BSL - Webcam',
          'Callback preference',
          'Minicom',
          'Skype',
          'Text relay',
          'No accommodations required'
        ],
        additionalInfo: ''
      }
    });
  }),

  // Catch-all handler for unmatched requests (for coverage tracking)
  http.all('*', ({ request }) => {
    console.log('⚠️  Unhandled request:', request.method, request.url);
    
    // Return a generic error for unmocked endpoints
    return HttpResponse.json(
      { 
        error: 'Endpoint not mocked', 
        method: request.method,
        url: request.url,
        timestamp: new Date().toISOString()
      }, 
      { status: 404 }
    );
  })
];

/**
 * Combined handlers array
 * In Phase 2, this will combine all domain-specific handlers:
 * export const handlers = [
 *   ...casesHandlers,
 *   ...clientDetailsHandlers, 
 *   ...searchHandlers,
 *   ...thirdPartyHandlers
 * ];
 */
export const handlers = [
  ...temporaryHandlers
];

console.log('📦 MSW handlers loaded:', handlers.length);
