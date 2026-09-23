/**
 * Personal Details endpoint handlers
 */

import { http, HttpResponse } from 'msw';
import type { MockCase } from './types.js';
import { findMockCase, updateCaseState } from './utils.js';
import { HTTP } from '#src/services/api/base/constants.js';
import type { FinancialEligibilityData } from '#types/api-types.js';

export function createFinancialEligibilityHandlers(
  API_BASE_URL: string,
  API_PREFIX: string,
  cases: MockCase[]
) {
  return [
    http.get(`${API_BASE_URL}${API_PREFIX}/case/:caseReference/eligibility_check/`, ({params}) => {
      const {caseReference}=params;

      const caseItem=findMockCase(caseReference as string, cases);

      if(!caseItem) {
        return HttpResponse.json({error: 'Case not found'}, {status: HTTP.NOT_FOUND});
      }

      return HttpResponse.json(caseItem.financialEligibility);

    }),

    // PATCH /case/:caseReference/eligibility_check/
    http.patch(`${API_BASE_URL}${API_PREFIX}/case/:caseReference/eligibility_check/`, async ({params, request}) => {
      const caseReference=String(params.caseReference);

      const caseItem=findMockCase(caseReference as string, cases);

      if(!caseItem) {
        return HttpResponse.json({error: 'Case not found'}, {status: HTTP.NOT_FOUND});
      }

      const payload=await request.json() as FinancialEligibilityData;

      console.log(
        '[MSW] FE PATCH PAYLOAD',
        JSON.stringify(payload, null, 2)
      );

      const updatedFinancialEligibility={
        ...caseItem.financialEligibility,
        ...payload
      } as FinancialEligibilityData;

      updateCaseState(caseReference, {
        financialEligibility:
          updatedFinancialEligibility as unknown as MockCase['financialEligibility']
      });

      console.log("updated eligibility", updatedFinancialEligibility);
      return HttpResponse.json(
        updatedFinancialEligibility
      );

    })
  ];
}