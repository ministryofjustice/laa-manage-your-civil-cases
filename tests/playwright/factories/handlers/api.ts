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

  // Intercept cases by status (GET /latest/mock/cases/{status})
  // Put this AFTER the individual case handler
  http.get(`${API_BASE_URL}${API_PREFIX}/cases/:caseType`, ({ params, request }) => {
    const { caseType } = params;
    
    // Skip if this looks like a case reference
    if (/^PC-\d{4}-\d{4}$/.test(caseType as string)) {
      return; // Let case details handler process this
    }
    
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    
    
    const filteredCases = filterCasesByStatus(caseType as string);
    const result = paginateResults(filteredCases, page, limit);
    
    // Return the data array with the correct headers that apiService.extractPaginationMeta expects
    return HttpResponse.json(result.data, {
      headers: {
        'x-total-count': result.pagination.total.toString(),
        'x-page': result.pagination.page.toString(),
        'x-per-page': result.pagination.limit.toString(),  // Note: x-per-page, not x-limit
        'x-total-pages': result.pagination.totalPages.toString(),
      }
    });
  }),

  // Intercept case search (GET /latest/mock/cases/search)
  http.get(`${API_BASE_URL}${API_PREFIX}/cases/search`, ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword') || '';
    const status = url.searchParams.get('status') || '';
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    
    
    let filteredCases = cases;
    
    // Filter by keyword if provided
    if (keyword) {
      const beforeFilter = filteredCases.length;
      filteredCases = filteredCases.filter(caseItem => 
        caseItem.fullName.toLowerCase().includes(keyword.toLowerCase()) ||
        caseItem.caseReference.toLowerCase().includes(keyword.toLowerCase())
      );
    }
    
    // Filter by status if provided
    if (status) {
      filteredCases = filteredCases.filter(caseItem => {
        const statusMap: Record<string, string[]> = {
          'new': ['New'],
          'accepted': ['Accepted'],
          'opened': ['Opened'],
          'closed': ['Closed']
        };
        
        // If status is 'all', include all cases
        if (status === 'all') {
          return true;
        }
        
        const validStatuses = statusMap[status] || [];
        return validStatuses.includes(caseItem.caseStatus);
      });
    }
    
    const result = paginateResults(filteredCases, page, limit);
    
    
    return HttpResponse.json(result.data, {
      headers: {
        'x-total-count': result.pagination.total.toString(),
        'x-page': result.pagination.page.toString(),
        'x-per-page': result.pagination.limit.toString(),
        'x-total-pages': result.pagination.totalPages.toString(),
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