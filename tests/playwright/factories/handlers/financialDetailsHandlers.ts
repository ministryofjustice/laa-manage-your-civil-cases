/**
 * Personal Details endpoint handlers
 */

import { http, HttpResponse } from 'msw';
import type { MockCase } from './types.js';
import { transformToApiFormat, findMockCase } from './utils.js';
import { HTTP } from '#src/services/api/base/constants.js';

export function createFinancialEligibilityHandlers(
  API_BASE_URL: string,
  API_PREFIX: string,
  cases: MockCase[]
) {
  return [
    http.get(`${API_BASE_URL}${API_PREFIX}/case/:caseReference/eligibility_check/`, ({ params }) => {
      const { caseReference } = params;

      const caseItem = findMockCase(caseReference as string, cases);

      if (!caseItem) {
        return HttpResponse.json({ error: 'Case not found' }, { status: HTTP.NOT_FOUND });
      }

      if (caseReference === 'PC-1922-1879') {
         return HttpResponse.json(caseItem.financialElibility);
      }
      if (caseReference === 'PC-1869-9154') {
         return HttpResponse.json(caseItem.financialElibility);
      }
  
    })
  ];
}