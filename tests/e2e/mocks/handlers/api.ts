import { http, HttpResponse } from 'msw';

// Mock handlers for downstream API calls that our Express server makes
export const apiHandlers = [
  // Mock the downstream client details API call
  // This intercepts: GET https://laa-civil-case-api-uat.cloud-platform.service.justice.gov.uk/latest/mock/cases/PC-1922-1879
  http.get('https://laa-civil-case-api-uat.cloud-platform.service.justice.gov.uk/latest/mock/cases/PC-1922-1879', () => {
    console.log('🎯 MSW intercepted downstream API call for client details!');
    return HttpResponse.json({
      caseReference: 'PC-1922-1879',
      fullName: 'MSW Test Client',
      phoneNumber: '+44 7700 900123',
      safeToCall: true,
      announceCall: false,
      dateOfBirth: '1990-01-01',
      emailAddress: 'msw.test@example.com',
      address: '123 MSW Test Street',
      postcode: 'MSW 123',
      caseStatus: 'open',
      dateReceived: '2024-01-01',
      refCode: 'MSW001'
    });
  }),
];
