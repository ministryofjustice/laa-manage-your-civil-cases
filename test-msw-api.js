/**
 * Quick test to verify MSW API interception
 */

import { setupServer } from 'msw/node';
import { handlers } from './tests/e2e/mocks/handlers/index.js';
import axios from 'axios';

// Initialize MSW server
const mswServer = setupServer(...handlers);
mswServer.listen({ onUnhandledRequest: 'warn' });
console.log('🎭 MSW server started with', handlers.length, 'handlers\n');

const API_BASE_URL = 'https://laa-civil-case-api-uat.cloud-platform.service.justice.gov.uk';

async function testMSWInterception() {
  console.log('🧪 Testing MSW API interception...\n');

  try {
    // Test 1: Get new cases (should be intercepted by MSW)
    console.log('📡 Testing GET /latest/mock/cases/new...');
    const newCasesResponse = await axios.get(`${API_BASE_URL}/latest/mock/cases/new?page=1&limit=5`);
    console.log('✅ Response status:', newCasesResponse.status);
    console.log('✅ Response headers:', {
      'x-total-count': newCasesResponse.headers['x-total-count'],
      'x-page': newCasesResponse.headers['x-page'],
      'x-per-page': newCasesResponse.headers['x-per-page'],
      'x-total-pages': newCasesResponse.headers['x-total-pages']
    });
    console.log('✅ First case:', newCasesResponse.data[0]?.caseReference || 'No cases found');
    console.log('');

    // Test 2: Get a specific case (should be intercepted by MSW)
    console.log('📡 Testing GET /latest/mock/cases/PC-1234-5678...');
    const caseResponse = await axios.get(`${API_BASE_URL}/latest/mock/cases/PC-1234-5678`);
    console.log('✅ Response status:', caseResponse.status);
    console.log('✅ Case reference:', caseResponse.data.caseReference);
    console.log('✅ Client name:', caseResponse.data.fullName);
    console.log('');

    // Test 3: Authentication (should be intercepted by MSW)
    console.log('📡 Testing POST /latest/token...');
    const authResponse = await axios.post(`${API_BASE_URL}/latest/token`, {
      grant_type: 'client_credentials'
    });
    console.log('✅ Response status:', authResponse.status);
    console.log('✅ Token type:', authResponse.data.token_type);
    console.log('');

    console.log('🎉 All MSW interceptions working correctly!');

  } catch (error) {
    console.error('❌ Error testing MSW:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testMSWInterception();