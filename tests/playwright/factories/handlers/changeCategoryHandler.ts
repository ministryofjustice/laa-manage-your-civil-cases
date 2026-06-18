/**
 * Change Category endpoint handler
 */

import { http, HttpResponse } from 'msw';
import type { MockCase } from './types.js';
import { HTTP } from '#src/services/api/base/constants.js';

export function createChangeCategoryHandler(
  API_BASE_URL: string,
  API_PREFIX: string,
  cases: MockCase[]
) {
  return [
    // PATCH /case/${caseReference}/category-change/
   http.patch(`${API_BASE_URL}${API_PREFIX}/mcc/case/:caseReference/category-change/`, async ({  params, request }) => {
      console.log('MSW HIT: category-change', params.caseReference);
      
      const { caseReference } = params;
      const body = (await request.json()) as {
        category: string;
        internal: boolean;
        notes: string;
      };

      const caseItem = cases.find(c => c.caseReference === caseReference);
      
      if (!caseItem) {
        return HttpResponse.json({ error: 'Case not found' }, { status: HTTP.NOT_FOUND });
      }

      caseItem.category = body.category;
      return new HttpResponse(null, { status: 204 });
    })
  ];
}
