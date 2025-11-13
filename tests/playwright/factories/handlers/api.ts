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

const mapSafe = (booleanValueTrue?: boolean) => (booleanValueTrue ? 'SAFE' : 'DONT_CALL');

/**
 * Transform mock case data to CLA API format (snake_case with nested objects)
 * @param {MockCase} caseItem - Mock case data
 * @returns {object} Case data in CLA API format
 */
function transformToApiFormat(caseItem: MockCase): object {
  return {
    reference: caseItem.caseReference,
    laa_reference: caseItem.laaReference,
    full_name: caseItem.fullName,
    date_of_birth: caseItem.dateOfBirth,
    state: caseItem.caseStatus,
    provider_assigned_at: caseItem.dateReceived,
    modified: caseItem.lastModified || caseItem.dateReceived,
    provider_closed: caseItem.dateClosed || null,
    // Personal details nested object
    personal_details: {
      full_name: caseItem.fullName,
      date_of_birth: caseItem.dateOfBirth,
      home_phone: caseItem.phoneNumber,
      mobile_phone: caseItem.phoneNumber,
      safe_to_contact: mapSafe(caseItem.safeToCall),
      announce_call: caseItem.announceCall,
      email: caseItem.emailAddress,
      street: caseItem.address,
      postcode: caseItem.postcode
    },
    // Adaptation details nested object
    adaptation_details: caseItem.clientSupportNeeds ? {
      bsl_webcam: caseItem.clientSupportNeeds.bslWebcam === 'Yes',
      minicom: caseItem.clientSupportNeeds.textRelay === 'Yes',
      text_relay: caseItem.clientSupportNeeds.textRelay === 'Yes',
      callback_preference: caseItem.clientSupportNeeds.callbackPreference === 'Yes',
      language: caseItem.clientSupportNeeds.languageSupportNeeds || null,
      notes: caseItem.clientSupportNeeds.notes || null
    } : {
      // Provide empty structure when no client support needs
      bsl_webcam: false,
      minicom: false,
      text_relay: false,
      callback_preference: false,
      language: null,
      notes: null
    },
    // Third party details nested object
    thirdparty_details: caseItem.thirdParty ? {
      personal_details: {
        full_name: caseItem.thirdParty.fullName,
        email: caseItem.thirdParty.emailAddress,
        mobile_phone: caseItem.thirdParty.contactNumber,
        safe_to_contact: mapSafe(caseItem.thirdParty.safeToCall),
        street: caseItem.thirdParty.address,
        postcode: caseItem.thirdParty.postcode
      },
      personal_relationship: caseItem.thirdParty.relationshipToClient?.selected?.[0] || 'PARENT_GUARDIAN',
      personal_relationship_note: null,
      spoke_to: true,
      no_contact_reason: caseItem.thirdParty.passphraseSetUp?.selected?.[0] || 'OTHER',
      organisation_name: null,
      reason: caseItem.thirdParty.passphraseSetUp?.selected?.[0] || 'OTHER',
      pass_phrase: caseItem.thirdParty.passphraseSetUp?.passphrase || null
    } : null
  };
}

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
  http.post(`${API_BASE_URL}/oauth2/access_token`, () => HttpResponse.json({
      access_token: 'mock-jwt-token',
      token_type: 'Bearer',
      expires_in: 3600
    })),

  // Intercept individual case details (GET /latest/mock/case/{caseReference}/detailed)
  // This is what the app actually calls for client details pages
  http.get(`${API_BASE_URL}${API_PREFIX}/case/:caseReference/detailed`, ({ params }) => {
    const { caseReference } = params;
    
    console.log(`[MSW] Intercepting GET /case/${caseReference}/detailed`);
    
    const caseItem = cases.find(c => c.caseReference === caseReference);
    
    if (!caseItem) {
      console.log(`[MSW] Case ${caseReference} not found in mock data`);
      return HttpResponse.json({ error: 'Case not found' }, { status: 404 });
    }
    
    console.log(`[MSW] Returning case data for ${caseReference}`);
    
    // Transform mock data to match the real CLA API response format
    return HttpResponse.json(transformToApiFormat(caseItem));
  }),

  // Intercept cases by status or search (GET /cla_provider/api/v1/case)
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

  // Intercept client personal details updates (PATCH /cla_provider/api/v1/case/{caseReference}/personal_details/)
  http.patch(`${API_BASE_URL}${API_PREFIX}/case/:caseReference/personal_details/`, async ({ params, request }) => {
    const { caseReference } = params;
    const updateData = await request.json() as Record<string, any>;
    
    const caseItem = cases.find(c => c.caseReference === caseReference);
    
    if (!caseItem) {
      return HttpResponse.json({ error: 'Case not found' }, { status: 404 });
    }
    
    // Return the case in API format (in real implementation this would update the mock data)
    return HttpResponse.json(transformToApiFormat(caseItem));
  }),

  // Intercept client adaptation details updates (PATCH /cla_provider/api/v1/case/{caseReference}/adaptation_details/)
  http.patch(`${API_BASE_URL}${API_PREFIX}/case/:caseReference/adaptation_details/`, async ({ params, request }) => {
    const { caseReference } = params;
    const updateData = await request.json() as Record<string, any>;
    
    const caseItem = cases.find(c => c.caseReference === caseReference);
    
    if (!caseItem) {
      return HttpResponse.json({ error: 'Case not found' }, { status: 404 });
    }
    
    // Return the full case data in API format (apiService re-fetches after PATCH)
    return HttpResponse.json(transformToApiFormat(caseItem));
  }),

  // Intercept add third party contact (POST /cla_provider/api/v1/case/{caseReference}/thirdparty_details)
  http.post(`${API_BASE_URL}${API_PREFIX}/case/:caseReference/thirdparty_details`, async ({ params, request }) => {
    const { caseReference } = params;
    const thirdPartyData = await request.json() as Record<string, any>;
    
    const caseItem = cases.find(c => c.caseReference === caseReference);
    
    if (!caseItem) {
      return HttpResponse.json({ error: 'Case not found' }, { status: 404 });
    }
    
    // Return the case in API format (what apiService expects)
    return HttpResponse.json(transformToApiFormat(caseItem), { status: 201 });
  }),

  // Intercept update third party contact (PATCH /cla_provider/api/v1/case/{caseReference}/thirdparty_details)
  http.patch(`${API_BASE_URL}${API_PREFIX}/case/:caseReference/thirdparty_details`, async ({ params, request }) => {
    const { caseReference } = params;
    const thirdPartyData = await request.json() as Record<string, any>;
    
    const caseItem = cases.find(c => c.caseReference === caseReference);
    
    if (!caseItem) {
      return HttpResponse.json({ error: 'Case not found' }, { status: 404 });
    }
    
    // Return the case in API format (what apiService expects)
    return HttpResponse.json(transformToApiFormat(caseItem));
  }),

  // Intercept delete third party contact (DELETE /cla_provider/api/v1/cases/{caseReference}/third-party)
  http.delete(`${API_BASE_URL}${API_PREFIX}/cases/:caseReference/third-party`, ({ params, request }) => {
    const { caseReference } = params;
    const url = new URL(request.url);
    const thirdPartyId = url.searchParams.get('id');
    
    const caseItem = cases.find(c => c.caseReference === caseReference);
    
    if (!caseItem) {
      return HttpResponse.json({ error: 'Case not found' }, { status: 404 });
    }
    
    // Create a modified version without third party for the response
    const caseWithoutThirdParty = { ...caseItem, thirdParty: null };
    
    // Return the case in API format without third party data
    return HttpResponse.json(transformToApiFormat(caseWithoutThirdParty));
  }),

  // Intercept add client support needs (POST /cla_provider/api/v1/cases/{caseReference}/client-support-needs)
  http.post(`${API_BASE_URL}${API_PREFIX}/cases/:caseReference/client-support-needs`, async ({ params, request }) => {
    const { caseReference } = params;
    const clientSupportNeeds = await request.json() as Record<string, any>;
    
    const caseItem = cases.find(c => c.caseReference === caseReference);
    
    if (!caseItem) {
      return HttpResponse.json({ error: 'Case not found' }, { status: 404 });
    }
    
    // Return the case in API format (what apiService expects)
    return HttpResponse.json(transformToApiFormat(caseItem), { status: 201 });
  }),

  // Intercept delete client support needs (DELETE /cla_provider/api/v1/cases/{caseReference}/client-support-needs)
  http.delete(`${API_BASE_URL}${API_PREFIX}/cases/:caseReference/client-support-needs`, ({ params }) => {
    const { caseReference } = params;
    
    const caseItem = cases.find(c => c.caseReference === caseReference);
    
    if (!caseItem) {
      return HttpResponse.json({ error: 'Case not found' }, { status: 404 });
    }
    
    // Create a modified version without client support needs for the response
    const caseWithoutSupportNeeds = { ...caseItem, clientSupportNeeds: undefined };
    
    // Return the case in API format without client support needs data
    return HttpResponse.json(transformToApiFormat(caseWithoutSupportNeeds));
  }),

];