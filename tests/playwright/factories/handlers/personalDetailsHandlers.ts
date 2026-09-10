/**
 * Personal Details endpoint handlers
 */

import { http, HttpResponse } from 'msw';
import type { MockCase } from './types.js';
import { transformToApiFormat, findMockCase, updateCaseState, buildPersonalDetailsUpdates } from './utils.js';
import { validatePersonalDetails } from './validationHelpers.js';
import { HTTP } from '#src/services/api/base/constants.js';

export function createPersonalDetailsHandlers(
  API_BASE_URL: string,
  API_PREFIX: string,
  cases: MockCase[]
) {
  return [
    http.get(`${API_BASE_URL}${API_PREFIX}/case/:caseReference/personal_details/get_diversity`, ({ params }) => {

      const { caseReference } = params;
      const caseItem = findMockCase(caseReference as string, cases);

      if (!caseItem) {
        return HttpResponse.json({ error: 'Case not found' }, { status: HTTP.NOT_FOUND });
      }

      if (caseReference === 'PC-2211-4466') {
        return HttpResponse.json({
          gender: 'Male',
          ethnicity: 'Mixed Other',
          disability: 'OTH - Other'
        });
      } 

      if (caseReference === 'PC-7755-4557') {
        return HttpResponse.json({
          gender: 'Prefer not to say',
          ethnicity: 'Prefer not to say',
          disability: 'NCD - Not Considered Disabled'
        });
      } 

      return HttpResponse.json({
        gender: null,
        ethnicity: null,
        disability: null
      });

    }),

    http.patch(`${API_BASE_URL}${API_PREFIX}/case/:caseReference/personal_details/`, async ({ params, request }) => {

      const { caseReference } = params;
      const updateData = await request.json() as Record<string, any>;
      const caseItem = cases.find(c => c.caseReference === caseReference);
      
      if (!caseItem) {
        return HttpResponse.json({ error: 'Case not found' }, { status: HTTP.NOT_FOUND });
      }

      const validationErrors = validatePersonalDetails(updateData);

      if (Object.keys(validationErrors).length > 0) {
        return HttpResponse.json(validationErrors, {
          status: HTTP.BAD_REQUEST
        });
      }

      updateCaseState(caseReference as string, buildPersonalDetailsUpdates(updateData));

      return HttpResponse.json(transformToApiFormat(caseItem));
    })
  ];
}
