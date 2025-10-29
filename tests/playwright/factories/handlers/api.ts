/**
 * API Handlers for MSW
 * 
 * These handlers intercept outgoing HTTP requests that the Express application makes
 * to external APIs and serve mock responses with the correct headers that apiService expects.
 */

import { http, HttpResponse } from 'msw';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load official mock data from laa-civil-case-api
const mockDataPath = join(__dirname, '../../fixtures/mock-data.json');
const mockData = JSON.parse(readFileSync(mockDataPath, 'utf-8'));

// Base API URL that the application calls
const API_BASE_URL = 'https://laa-cla-backend-uat.apps.live-1.cloud-platform.service.justice.gov.uk';
const API_PREFIX = '/cla_provider/api/v1';

// Types based on official laa-civil-case-api mock data structure
interface MockCase {
  fullName: string;
  caseReference: string;
  refCode: string;
  dateReceived: string;
  lastModified?: string;
  dateClosed?: string;
  caseStatus: string;
  dateOfBirth: string;
  clientIsVulnerable: boolean;
  language: string;
  phoneNumber: string;
  safeToCall: boolean;
  announceCall: boolean;
  emailAddress: string;
  address: string;
  postcode: string;
  laaReference: string;
  thirdParty?: {
    fullName: string;
    emailAddress: string;
    contactNumber: string;
    safeToCall: boolean;
    address: string;
    postcode: string;
    relationshipToClient: {
      selected: string[];
    };
    passphraseSetUp: {
      selected: string[];
      passphrase?: string;
    };
  } | null;
  clientSupportNeeds?: {
    bslWebcam?: string;
    textRelay?: string;
    callbackPreference?: string;
    languageSupportNeeds?: string;
    notes?: string;
  };
}

// Cast the imported JSON to our known structure
const cases = mockData as MockCase[];

/**
 * Filter cases by status type
 * @param {string} status - The status to filter by
 * @returns {MockCase[]} Array of filtered cases
 */
function filterCasesByStatus(status: string): MockCase[] {
  const statusMap: Record<string, string[]> = {
    'new': ['New'],
    'accepted': ['Accepted'],
    'opened': ['Opened'],
    'closed': ['Closed']
  };

  const validStatuses = statusMap[status] || [];
  return cases.filter(caseItem => validStatuses.includes(caseItem.caseStatus));
}

/**
 * Paginate results
 * @param {MockCase[]} data - Array of cases to paginate
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Items per page (default: 20)
 * @returns {object} Object containing paginated data and pagination metadata
 */
function paginateResults(data: MockCase[], page = 1, limit = 20) {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  return {
    data: data.slice(startIndex, endIndex),
    pagination: {
      total: data.length,
      page,
      limit,
      totalPages: Math.ceil(data.length / limit)
    }
  };
}

export const apiHandlers = [
  // Intercept authentication token requests
  http.post(`${API_BASE_URL}/latest/token`, () => HttpResponse.json({
      access_token: 'mock-jwt-token',
      token_type: 'Bearer',
      expires_in: 3600
    })),

  // Intercept individual case details (GET /latest/mock/cases/{caseReference})
  // Put this BEFORE the status handler to match specific case references first
  http.get(`${API_BASE_URL}${API_PREFIX}/cases/:caseReference`, ({ params }) => {
    const { caseReference } = params;
    
    // Only match if it looks like a case reference (PC-XXXX-XXXX format)
    if (!/^PC-\d{4}-\d{4}$/.test(caseReference as string)) {
      return; // Let other handlers process this
    }
    
    const caseItem = cases.find(c => c.caseReference === caseReference);
    
    if (!caseItem) {
      return HttpResponse.json({ error: 'Case not found' }, { status: 404 });
    }
    
    // Return the official case data with existing thirdParty and clientSupportNeeds
    return HttpResponse.json(caseItem);
  }),

  // Intercept cases by status or search (GET /latest/mock/case)
  // This handler now matches the new API endpoint format with query parameters
  http.get(`${API_BASE_URL}${API_PREFIX}/case`, ({ request }) => {
    const url = new URL(request.url);
    const only = url.searchParams.get('only') || '';
    const search = url.searchParams.get('search') || '';
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const page_size = parseInt(url.searchParams.get('page_size') || '20', 10);
    const ordering = url.searchParams.get('ordering') || '';
    
    let filteredCases = cases;
    
    // Filter by status if 'only' parameter provided (e.g., only=new, only=accepted)
    if (only) {
      filteredCases = filterCasesByStatus(only);
    }
    
    // Filter by search keyword if provided (for search functionality)
    if (search) {
      const searchLower = search.toLowerCase();
      filteredCases = filteredCases.filter(caseItem => 
        caseItem.fullName.toLowerCase().includes(searchLower) ||
        caseItem.caseReference.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply sorting if ordering parameter provided
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
    
    // Paginate results
    const result = paginateResults(filteredCases, page, page_size);
    
    // Return CLA API format with results array, count, and pagination metadata in body
    return HttpResponse.json({
      results: result.data,
      count: result.pagination.total,
      // Include pagination metadata in response body (new API format)
      pagination: {
        page: result.pagination.page,
        page_size: result.pagination.limit,
        total: result.pagination.total,
        total_pages: result.pagination.totalPages
      }
    });
  }),

  // Intercept client details updates (PUT /latest/mock/cases/{caseReference})
  http.put(`${API_BASE_URL}${API_PREFIX}/cases/:caseReference`, async ({ params, request }) => {
    const { caseReference } = params;
    const updateData = await request.json() as Record<string, any>;
    
    
    const caseItem = cases.find(c => c.caseReference === caseReference);
    
    if (!caseItem) {
      return HttpResponse.json({ error: 'Case not found' }, { status: 404 });
    }
    
    // Return the updated case data (in real implementation this would update the mock data)
    const updatedCase = { ...caseItem, ...updateData };
    
    return HttpResponse.json(updatedCase);
  }),

  // Intercept add third party contact (POST /latest/mock/cases/{caseReference}/third-party)
  http.post(`${API_BASE_URL}${API_PREFIX}/cases/:caseReference/third-party`, async ({ params, request }) => {
    const { caseReference } = params;
    const thirdPartyData = await request.json() as Record<string, any>;
    
    
    const caseItem = cases.find(c => c.caseReference === caseReference);
    
    if (!caseItem) {
      return HttpResponse.json({ error: 'Case not found' }, { status: 404 });
    }
    
    // Return the updated case with new third party data (what apiService expects)
    const updatedCase = {
      ...caseItem,
      thirdParty: {
        ...thirdPartyData,
        thirdPartyId: `tp-${Date.now()}` // Mock ID
      }
    };
    
    return HttpResponse.json(updatedCase, { status: 201 });
  }),

  // Intercept update third party contact (PUT /latest/mock/cases/{caseReference}/third-party)
  http.put(`${API_BASE_URL}${API_PREFIX}/cases/:caseReference/third-party`, async ({ params, request }) => {
    const { caseReference } = params;
    const thirdPartyData = await request.json() as Record<string, any>;
    
    
    const caseItem = cases.find(c => c.caseReference === caseReference);
    
    if (!caseItem) {
      return HttpResponse.json({ error: 'Case not found' }, { status: 404 });
    }
    
    // Return the updated case with modified third party data (what apiService expects)
    const updatedCase = {
      ...caseItem,
      thirdParty: {
        ...thirdPartyData
      }
    };
    
    return HttpResponse.json(updatedCase);
  }),

  // Intercept delete third party contact (DELETE /latest/mock/cases/{caseReference}/third-party)
  http.delete(`${API_BASE_URL}${API_PREFIX}/cases/:caseReference/third-party`, ({ params, request }) => {
    const { caseReference } = params;
    const url = new URL(request.url);
    const thirdPartyId = url.searchParams.get('id');
    
    
    const caseItem = cases.find(c => c.caseReference === caseReference);
    
    if (!caseItem) {
      return HttpResponse.json({ error: 'Case not found' }, { status: 404 });
    }
    
    // Return the updated case without third party data (what apiService expects)
    const updatedCase = {
      ...caseItem,
      thirdParty: null // Remove third party data
    };
    
    return HttpResponse.json(updatedCase);
  }),

  // Intercept delete client support needs (DELETE /latest/mock/cases/{caseReference}/client-support-needs)
  http.delete(`${API_BASE_URL}${API_PREFIX}/cases/:caseReference/client-support-needs`, ({ params }) => {
    const { caseReference } = params;
    
    
    const caseItem = cases.find(c => c.caseReference === caseReference);
    
    if (!caseItem) {
      return HttpResponse.json({ error: 'Case not found' }, { status: 404 });
    }
    
    // Return the updated case without client support needs data (what apiService expects)
    const updatedCase = {
      ...caseItem,
      clientSupportNeeds: null // Remove client support needs data
    };
    
    return HttpResponse.json(updatedCase);
  }),

];