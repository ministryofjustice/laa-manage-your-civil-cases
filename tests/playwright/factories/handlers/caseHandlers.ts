/**
 * Case and authentication endpoint handlers
 */

import { http, HttpResponse } from 'msw';
import type { MockCase } from './types.js';
import { transformToApiFormat, filterCasesByStatus, paginateResults, findMockCase, updateCaseState } from './utils.js';
import { HTTP } from '#src/services/api/base/constants.js';

/**
 * Authentication token handler
 */
function createAuthTokenHandler(API_BASE_URL: string) {
  return http.post(`${API_BASE_URL}/oauth2/access_token`, () => HttpResponse.json({
    access_token: 'mock-jwt-token',
    token_type: 'Bearer',
    expires_in: 3600
  }));
}

/**
 * GET /case/:caseReference/ - Get case information (used by re-fetch after updates)
 */
function createGetCaseHandler(
  API_BASE_URL: string,
  API_PREFIX: string,
  cases: MockCase[]
) {
  return http.get(`${API_BASE_URL}${API_PREFIX}/case/:caseReference/`, ({ params }) => {
    const { caseReference } = params;
    
    const caseItem = findMockCase(caseReference as string, cases);
    
    if (!caseItem) {
      return HttpResponse.json({ error: 'Case not found' }, { status: HTTP.NOT_FOUND });
    }
    
    return HttpResponse.json(transformToApiFormat(caseItem));
  });
}

/**
 * PATCH /case/:caseReference/ - Update case information (e.g., provider notes)
 */
function createPatchCaseHandler(
  API_BASE_URL: string,
  API_PREFIX: string,
  cases: MockCase[]
) {
  return http.patch(`${API_BASE_URL}${API_PREFIX}/case/:caseReference/`, async ({ params, request }) => {
    const { caseReference } = params;
    console.log(`[MSW] Intercepting PATCH /case/${caseReference}/`);
    
    const caseItem = findMockCase(caseReference as string, cases);
    
    if (!caseItem) {
      console.log(`[MSW] Case ${caseReference} not found in mock data (PATCH)`);
      return HttpResponse.json({ error: 'Case not found' }, { status: HTTP.NOT_FOUND });
    }
    
    // Parse the request body to get the updated provider notes
    const body = await request.json() as Record<string, unknown>;
    
    // Update the provider notes if provided
    if ('provider_notes' in body && typeof body.provider_notes === 'string') {
      // Get existing notes history or initialize as empty array
      const existingNotes = caseItem.notesHistory || [];
      
      // Create new note entry
      const newNote = {
        providerNotes: body.provider_notes,
        created: new Date().toISOString(),
        createdBy: 'test-user@example.com',
      };
      
      // Create updated notes array with new note prepended (most recent first)
      const updatedNotesHistory = [newNote, ...existingNotes];
      
      // Use updateCaseState to store the update (will be cleared between tests)
      updateCaseState(caseReference as string, { notesHistory: updatedNotesHistory });
      
      console.log(`[MSW] Added provider note for case ${caseReference}`);
    }
    
    // Get the updated case data (with state updates applied) and return it
    const updatedCase = findMockCase(caseReference as string, cases);
    console.log(`[MSW] Returning updated case data for ${caseReference}`);
    return HttpResponse.json(transformToApiFormat(updatedCase!));
  });
}

/**
 * GET /case/:caseReference/detailed - Get detailed case information
 */
function createGetCaseDetailedHandler(
  API_BASE_URL: string,
  API_PREFIX: string,
  cases: MockCase[]
) {
  return http.get(`${API_BASE_URL}${API_PREFIX}/case/:caseReference/detailed`, ({ params }) => {
    const { caseReference } = params;
    console.log(`[MSW] Intercepting GET /case/${caseReference}/detailed`);
    
    const caseItem = findMockCase(caseReference as string, cases);
    
    if (!caseItem) {
      console.log(`[MSW] Case ${caseReference} not found in mock data`);
      return HttpResponse.json({ error: 'Case not found' }, { status: HTTP.NOT_FOUND });
    }
    
    console.log(`[MSW] Returning case data for ${caseReference}`);
    return HttpResponse.json(transformToApiFormat(caseItem));
  });
}

/**
 * GET /case/:caseReference/logs/ - Get case history logs 
 * &
 * GET /case/:caseReference/logs?codes=CASE_VIEWED&codes=MIS&codes=MIS-OOS&codes=MIS-MEANS&codes=COI&codes=SPOP&codes=REOPEN&codes=REF-INT&codes=CLSP&codes=MERI&codes=DUPL&codes=CLOT - Get client case logs
 */
function createGetCaseHistoryAndLogsHandler(
  API_BASE_URL: string,
  API_PREFIX: string,
  cases: MockCase[]
) {
  return http.get(
    `${API_BASE_URL}${API_PREFIX}/case/:caseReference/logs/`,
    ({ params, request }) => {
      const { caseReference } = params;
      const url = new URL(request.url);
      const codes = url.searchParams.getAll('codes');

      console.log(`[MSW] Intercepting GET /case/${caseReference}logs/`, codes);

      const caseItem = findMockCase(caseReference as string, cases);

      if (!caseItem) {
        console.log(`[MSW] Case ${caseReference} not found in mock data (logs)`);
        return HttpResponse.json({ error: 'Case not found' }, { status: HTTP.NOT_FOUND });
      }

      // This case will have no provider notes when viewing `Case details` tab
      if (caseReference === 'PC-1924-9560') {
        return HttpResponse.json([]);
      }

      // This will check that the url has `codes` as part of the query parameter
      const isClientCaseLogsRequest = codes.length > 0;

      if (isClientCaseLogsRequest) {
        return HttpResponse.json([
          {
            code: 'MIS-MEANS',
            created_by: 'test_operator',
            created: '2026-03-08T17:14:45.428Z',
            notes: 'Has too much money',
            type: 'outcome',
          },
          {
            code: 'REOPEN',
            created_by: 'test_operator',
            created: '2026-04-08T17:10:11.530Z',
            notes: 'Actually, has no money',
            type: 'system',
          }
        ]);
      }

      // Minimal set of logs
      return HttpResponse.json([
        {
          code: 'MANALC',
          created_by: 'test_operator',
          created: '2025-12-08T17:14:45.428Z',
          notes: 'Assigned to Howells. ',
          type: 'outcome',
          level: '29',
          timer: 1746,
          patch: null
        },
        {
          code: 'CASE_CREATED',
          created_by: 'test_operator',
          created: '2025-12-08T17:10:11.530Z',
          notes: 'Case Created',
          type: 'system',
          level: '29',
          timer: null,
          patch: null
        }
      ]);
    }
  );
}

/**
 * GET /case - List/search cases with filtering, sorting, and pagination
 */
function createGetCasesListHandler(
  API_BASE_URL: string,
  API_PREFIX: string,
  cases: MockCase[]
) {
  return http.get(`${API_BASE_URL}${API_PREFIX}/case`, ({ request }) => {
    const url = new URL(request.url);
    const only = url.searchParams.get('only') || '';
    const search = url.searchParams.get('search') || '';
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const page_size = parseInt(url.searchParams.get('page_size') || '20', 10);
    const ordering = url.searchParams.get('ordering') || '';
    
    let filteredCases = cases;
    
    if (only) {
      filteredCases = filterCasesByStatus(only, cases);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredCases = filteredCases.filter(caseItem => 
        caseItem.fullName.toLowerCase().includes(searchLower) ||
        caseItem.caseReference.toLowerCase().includes(searchLower)
      );
    }
    
    if (ordering) {
      const isDescending = ordering.startsWith('-');
      const sortField = isDescending ? ordering.substring(1) : ordering;
      
      filteredCases = [...filteredCases].sort((a, b) => {
        const aVal = (a as any)[sortField];
        const bVal = (b as any)[sortField];
        
        if (aVal < bVal) return isDescending ? 1 : -1;
        if (aVal > bVal) return isDescending ? -1 : 1;
        return 0;
      });
    }
    
    const result = paginateResults(filteredCases, page, page_size);
    
    return HttpResponse.json({
      results: result.data.map(transformToApiFormat),
      count: result.pagination.total,
      pagination: {
        page: result.pagination.page,
        page_size: result.pagination.limit,
        total: result.pagination.total,
        total_pages: result.pagination.totalPages
      }
    });
  });
}

/**
 * Create all case and authentication handlers
 */
export function createCaseHandlers(
  API_BASE_URL: string,
  API_PREFIX: string,
  cases: MockCase[]
) {
  return [
    createAuthTokenHandler(API_BASE_URL),
    createGetCaseHandler(API_BASE_URL, API_PREFIX, cases),
    createPatchCaseHandler(API_BASE_URL, API_PREFIX, cases),
    createGetCaseDetailedHandler(API_BASE_URL, API_PREFIX, cases),
    createGetCasesListHandler(API_BASE_URL, API_PREFIX, cases),
    createGetCaseHistoryAndLogsHandler(API_BASE_URL, API_PREFIX, cases)
  ];
}
