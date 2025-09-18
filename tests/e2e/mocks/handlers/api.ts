/**
 * API Handlers for MSW
 * 
 * These handlers intercept outgoing HTTP requests that the Express application makes
 * to external APIs and serve mock responses with the correct headers that apiService expects.
 */

import { http, HttpResponse } from 'msw';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load mock data
const mockDataPath = join(__dirname, '../../fixtures/mock-data.json');
const mockData = JSON.parse(readFileSync(mockDataPath, 'utf-8'));

// Base API URL that the application calls
const API_BASE_URL = 'https://laa-civil-case-api-uat.cloud-platform.service.justice.gov.uk';
const API_PREFIX = '/latest/mock';

// Types based on our mock data structure
interface MockCase {
  caseReference: string;
  fullName: string;
  phoneNumber: string;
  safeToCall: boolean;
  announceCall: boolean;
  dateOfBirth: string;
  emailAddress: string;
  address: string;
  postcode: string;
  caseStatus: string;
  dateReceived: string;
  refCode: string;
}

// Cast the imported JSON to our known structure
const cases = mockData as MockCase[];

/**
 * Filter cases by status type
 */
function filterCasesByStatus(status: string): MockCase[] {
  const statusMap: Record<string, string[]> = {
    'new': ['New'],
    'accepted': ['Accepted'],
    'opened': ['Open', 'Opened'],
    'closed': ['Closed', 'Completed']
  };

  const validStatuses = statusMap[status] || [];
  return cases.filter(caseItem => validStatuses.includes(caseItem.caseStatus));
}

/**
 * Paginate results
 */
function paginateResults(data: MockCase[], page: number = 1, limit: number = 20) {
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
  http.post(`${API_BASE_URL}/latest/token`, () => {
    console.log(`🎯 MSW intercepted: POST /latest/token`);
    
    return HttpResponse.json({
      access_token: 'mock-jwt-token',
      token_type: 'Bearer',
      expires_in: 3600
    });
  }),

  // Intercept individual case details (GET /latest/mock/cases/{caseReference})
  // Put this BEFORE the status handler to match specific case references first
  http.get(`${API_BASE_URL}${API_PREFIX}/cases/:caseReference`, ({ params }) => {
    const { caseReference } = params;
    
    // Only match if it looks like a case reference (PC-XXXX-XXXX format)
    if (!/^PC-\d{4}-\d{4}$/.test(caseReference as string)) {
      return; // Let other handlers process this
    }
    
    console.log(`🎯 MSW intercepted: GET ${API_PREFIX}/cases/${caseReference}`);
    
    const caseItem = cases.find(c => c.caseReference === caseReference);
    
    if (!caseItem) {
      return HttpResponse.json({ error: 'Case not found' }, { status: 404 });
    }
    
    // Add mock third party data for testing remove functionality
    const caseWithThirdParty = {
      ...caseItem,
      thirdParty: {
        thirdPartyFullName: 'Mock Third Party',
        thirdPartyEmailAddress: 'mock@example.com',
        thirdPartyContactNumber: '07700900123',
        thirdPartySafeToCall: true,
        thirdPartyAddress: '123 Mock Street\nLondon',
        thirdPartyPostcode: 'SW1A 1AA',
        thirdPartyRelationshipToClient: 'Family member or friend',
        thirdPartyPassphraseSetUp: 'Yes',
        thirdPartyPassphrase: 'mock-passphrase'
      }
    };
    
    return HttpResponse.json(caseWithThirdParty);
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
    
    console.log(`🎯 MSW intercepted: GET ${API_PREFIX}/cases/${caseType} (page ${page}, limit ${limit})`);
    
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
    
    console.log(`🎯 MSW intercepted: GET ${API_PREFIX}/cases/search (keyword: ${keyword}, status: ${status})`);
    
    let filteredCases = cases;
    
    // Filter by keyword if provided
    if (keyword) {
      filteredCases = filteredCases.filter(caseItem => 
        caseItem.fullName.toLowerCase().includes(keyword.toLowerCase()) ||
        caseItem.caseReference.toLowerCase().includes(keyword.toLowerCase())
      );
    }
    
    // Filter by status if provided
    if (status) {
      filteredCases = filterCasesByStatus(status);
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
    
    console.log(`🎯 MSW intercepted: PUT ${API_PREFIX}/cases/${caseReference}`, updateData);
    
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
    
    console.log(`🎯 MSW intercepted: POST ${API_PREFIX}/cases/${caseReference}/third-party`, thirdPartyData);
    
    const caseItem = cases.find(c => c.caseReference === caseReference);
    
    if (!caseItem) {
      return HttpResponse.json({ error: 'Case not found' }, { status: 404 });
    }
    
    // Return success response for adding third party contact
    return HttpResponse.json({ 
      success: true, 
      message: 'Third party contact added successfully',
      thirdPartyId: `tp-${Date.now()}` // Mock ID
    }, { status: 201 });
  }),

  // Intercept update third party contact (PUT /latest/mock/cases/{caseReference}/third-party)
  http.put(`${API_BASE_URL}${API_PREFIX}/cases/:caseReference/third-party`, async ({ params, request }) => {
    const { caseReference } = params;
    const thirdPartyData = await request.json() as Record<string, any>;
    
    console.log(`🎯 MSW intercepted: PUT ${API_PREFIX}/cases/${caseReference}/third-party`, thirdPartyData);
    
    const caseItem = cases.find(c => c.caseReference === caseReference);
    
    if (!caseItem) {
      return HttpResponse.json({ error: 'Case not found' }, { status: 404 });
    }
    
    // Return success response for updating third party contact
    return HttpResponse.json({ 
      success: true, 
      message: 'Third party contact updated successfully'
    });
  }),

  // Intercept delete third party contact (DELETE /latest/mock/cases/{caseReference}/third-party)
  http.delete(`${API_BASE_URL}${API_PREFIX}/cases/:caseReference/third-party`, ({ params, request }) => {
    const { caseReference } = params;
    const url = new URL(request.url);
    const thirdPartyId = url.searchParams.get('id');
    
    console.log(`🎯 MSW intercepted: DELETE ${API_PREFIX}/cases/${caseReference}/third-party?id=${thirdPartyId}`);
    
    const caseItem = cases.find(c => c.caseReference === caseReference);
    
    if (!caseItem) {
      return HttpResponse.json({ error: 'Case not found' }, { status: 404 });
    }
    
    // Return success response for deleting third party contact
    return HttpResponse.json({ 
      success: true, 
      message: 'Third party contact deleted successfully'
    });
  }),

  // Intercept search cases (GET /latest/mock/cases/search)
  http.get(`${API_BASE_URL}${API_PREFIX}/cases/search`, ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword') || '';
    const status = url.searchParams.get('status') || '';
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    
    console.log(`🔍 MSW intercepted: GET ${API_PREFIX}/cases/search (keyword: "${keyword}", status: "${status}", page ${page}, limit ${limit})`);
    
    // Filter cases based on search criteria
    let filteredCases = cases;
    
    // Filter by keyword (search in case reference and name)
    if (keyword.trim()) {
      filteredCases = filteredCases.filter(c => 
        c.caseReference.toLowerCase().includes(keyword.toLowerCase()) ||
        c.fullName.toLowerCase().includes(keyword.toLowerCase())
      );
    }
    
    // Filter by status if provided
    if (status.trim() && status !== 'all') {
      filteredCases = filterCasesByStatus(status);
    }
    
    const result = paginateResults(filteredCases, page, limit);
    
    return HttpResponse.json(result.data, {
      headers: {
        'x-total-count': result.pagination.total.toString(),
        'x-page': result.pagination.page.toString(),
        'x-per-page': result.pagination.limit.toString(),
        'content-type': 'application/json'
      }
    });
  }),
];