/**
 * Case and authentication endpoint handlers
 */

import { http, HttpResponse } from 'msw';
import type { MockCase } from './types.js';
import { transformToApiFormat, filterCasesByStatus, paginateResults } from './utils.js';

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
    
    const caseItem = cases.find(c => c.caseReference === caseReference);
    
    if (!caseItem) {
      console.log(`[MSW] Case ${caseReference} not found in mock data`);
      return HttpResponse.json({ error: 'Case not found' }, { status: 404 });
    }
    
    console.log(`[MSW] Returning case data for ${caseReference}`);
    return HttpResponse.json(transformToApiFormat(caseItem));
  });
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
      results: result.data,
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
 * DELETE /cases/:caseReference/client-support-needs - Remove client support needs
 */
function createDeleteClientSupportNeedsHandler(
  API_BASE_URL: string,
  API_PREFIX: string,
  cases: MockCase[]
) {
  return http.delete(`${API_BASE_URL}${API_PREFIX}/cases/:caseReference/client-support-needs`, ({ params }) => {
    const { caseReference } = params;
    
    const caseItem = cases.find(c => c.caseReference === caseReference);
    
    if (!caseItem) {
      return HttpResponse.json({ error: 'Case not found' }, { status: 404 });
    }
    
    const caseWithoutSupportNeeds = { ...caseItem, clientSupportNeeds: undefined };
    return HttpResponse.json(transformToApiFormat(caseWithoutSupportNeeds));
  });
}

/**
 * POST /cases/:caseReference/client-support-needs - Add client support needs
 */
function createPostClientSupportNeedsHandler(
  API_BASE_URL: string,
  API_PREFIX: string,
  cases: MockCase[]
) {
  return http.post(`${API_BASE_URL}${API_PREFIX}/cases/:caseReference/client-support-needs`, async ({ params }) => {
    const { caseReference } = params;
    
    const caseItem = cases.find(c => c.caseReference === caseReference);
    
    if (!caseItem) {
      return HttpResponse.json({ error: 'Case not found' }, { status: 404 });
    }
    
    return HttpResponse.json(transformToApiFormat(caseItem), { status: 201 });
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
    createGetCaseDetailedHandler(API_BASE_URL, API_PREFIX, cases),
    createGetCasesListHandler(API_BASE_URL, API_PREFIX, cases),
    createDeleteClientSupportNeedsHandler(API_BASE_URL, API_PREFIX, cases),
    createPostClientSupportNeedsHandler(API_BASE_URL, API_PREFIX, cases)
  ];
}
