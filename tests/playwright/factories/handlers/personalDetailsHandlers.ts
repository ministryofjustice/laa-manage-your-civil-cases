/**
 * Personal Details endpoint handlers
 */

import { http, HttpResponse } from 'msw';
import type { MockCase } from './types.js';
import { transformToApiFormat, findMockCase, updateCaseState, buildPersonalDetailsUpdates } from './utils.js';
import {
  validateStringField,
  validateNullableBooleanField,
  validateChoiceField,
  validatePersonalDetails
} from './validationHelpers.js';
import { HTTP } from '#src/services/api/base/constants.js';

export function createPersonalDetailsHandlers(
  API_BASE_URL: string,
  API_PREFIX: string,
  cases: MockCase[]
) {
  return [
    // PATCH /case/:caseReference/personal_details/
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
