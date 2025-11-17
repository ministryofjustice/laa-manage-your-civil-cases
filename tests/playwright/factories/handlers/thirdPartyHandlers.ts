/**
 * Third Party Details endpoint handlers
 */

import { http, HttpResponse } from 'msw';
import type { MockCase } from './types.js';
import { transformToApiFormat } from './utils.js';
import { validatePersonalDetails, validateThirdPartyFields } from './validationHelpers.js';

export function createThirdPartyHandlers(
  API_BASE_URL: string,
  API_PREFIX: string,
  cases: MockCase[]
) {
  return [
    // PATCH /case/:caseReference/thirdparty_details/
    http.patch(`${API_BASE_URL}${API_PREFIX}/case/:caseReference/thirdparty_details/`, async ({ params, request }) => {
      console.log('[MSW HANDLER] === PATCH thirdparty_details INTERCEPTED ===');
      const { caseReference } = params;
      console.log('[MSW HANDLER] Case reference from params:', caseReference);
      const updateData = await request.json() as Record<string, any>;
      console.log('[MSW HANDLER] Update data received:', JSON.stringify(updateData, null, 2));
      
      const caseItem = cases.find(c => c.caseReference === caseReference);
      
      if (!caseItem) {
        console.log('[MSW HANDLER] Case not found:', caseReference);
        return HttpResponse.json({ error: 'Case not found' }, { status: 404 });
      }

      // Detect soft delete: personal_relationship = 'OTHER' with null full_name and pass_phrase
      const isSoftDelete = updateData.personal_relationship === 'OTHER' &&
                          updateData.full_name === null &&
                          updateData.pass_phrase === null;
      console.log('[MSW HANDLER] Soft delete detection:', { 
        isSoftDelete, 
        personal_relationship: updateData.personal_relationship,
        full_name: updateData.full_name,
        pass_phrase: updateData.pass_phrase
      });

      if (isSoftDelete) {
        console.log('[MSW HANDLER] Third party soft delete detected - clearing thirdParty field');
        caseItem.thirdParty = null;
        console.log('[MSW HANDLER] Returning transformed case data');
        return HttpResponse.json(transformToApiFormat(caseItem));
      }
      console.log('[MSW HANDLER] Not a soft delete, proceeding with validation');

      const validationErrors: Record<string, any> = {};

      if (typeof updateData !== 'object' || updateData === null || Array.isArray(updateData)) {
        return HttpResponse.json({ detail: 'Invalid request body format' }, { status: 400 });
      }

      // Validate top-level third party fields
      Object.assign(validationErrors, validateThirdPartyFields(updateData));

      // Validate nested personal_details object
      if ('personal_details' in updateData) {
        if (typeof updateData.personal_details !== 'object' || updateData.personal_details === null || Array.isArray(updateData.personal_details)) {
          validationErrors.personal_details = ['Must be an object'];
        } else {
          const personalDetailsErrors = validatePersonalDetails(updateData.personal_details);
          if (Object.keys(personalDetailsErrors).length > 0) {
            validationErrors.personal_details = personalDetailsErrors;
          }
        }
      }

      if (Object.keys(validationErrors).length > 0) {
        return HttpResponse.json(validationErrors, { status: 400 });
      }
      
      return HttpResponse.json(transformToApiFormat(caseItem));
    }),

    // POST /case/:caseReference/thirdparty_details/
    http.post(`${API_BASE_URL}${API_PREFIX}/case/:caseReference/thirdparty_details/`, async ({ params, request }) => {
      const { caseReference } = params;
      const thirdPartyData = await request.json() as Record<string, any>;
      
      const caseItem = cases.find(c => c.caseReference === caseReference);
      
      if (!caseItem) {
        return HttpResponse.json({ error: 'Case not found' }, { status: 404 });
      }

      const validationErrors: Record<string, any> = {};

      if (typeof thirdPartyData !== 'object' || thirdPartyData === null || Array.isArray(thirdPartyData)) {
        return HttpResponse.json({ detail: 'Invalid request body format' }, { status: 400 });
      }

      // Validate top-level third party fields
      Object.assign(validationErrors, validateThirdPartyFields(thirdPartyData));

      // Validate nested personal_details object (required for POST)
      if (!('personal_details' in thirdPartyData)) {
        validationErrors.personal_details = ['This field is required.'];
      } else if (typeof thirdPartyData.personal_details !== 'object' || thirdPartyData.personal_details === null || Array.isArray(thirdPartyData.personal_details)) {
        validationErrors.personal_details = ['Must be an object'];
      } else {
        const personalDetailsErrors = validatePersonalDetails(thirdPartyData.personal_details);
        if (Object.keys(personalDetailsErrors).length > 0) {
          validationErrors.personal_details = personalDetailsErrors;
        }
      }

      if (Object.keys(validationErrors).length > 0) {
        return HttpResponse.json(validationErrors, { status: 400 });
      }
      
      return HttpResponse.json(transformToApiFormat(caseItem), { status: 201 });
    }),

    // PUT /case/:caseReference/thirdparty_details/
    http.put(`${API_BASE_URL}${API_PREFIX}/case/:caseReference/thirdparty_details/`, async ({ params, request }) => {
      const { caseReference } = params;
      const thirdPartyData = await request.json() as Record<string, any>;
      
      const caseItem = cases.find(c => c.caseReference === caseReference);
      
      if (!caseItem) {
        return HttpResponse.json({ error: 'Case not found' }, { status: 404 });
      }

      const validationErrors: Record<string, any> = {};

      if (typeof thirdPartyData !== 'object' || thirdPartyData === null || Array.isArray(thirdPartyData)) {
        return HttpResponse.json({ detail: 'Invalid request body format' }, { status: 400 });
      }

      // Validate top-level third party fields
      Object.assign(validationErrors, validateThirdPartyFields(thirdPartyData));

      // Validate nested personal_details object (required for PUT)
      if (!('personal_details' in thirdPartyData)) {
        validationErrors.personal_details = ['This field is required.'];
      } else if (typeof thirdPartyData.personal_details !== 'object' || thirdPartyData.personal_details === null || Array.isArray(thirdPartyData.personal_details)) {
        validationErrors.personal_details = ['Must be an object'];
      } else {
        const personalDetailsErrors = validatePersonalDetails(thirdPartyData.personal_details);
        if (Object.keys(personalDetailsErrors).length > 0) {
          validationErrors.personal_details = personalDetailsErrors;
        }
      }

      if (Object.keys(validationErrors).length > 0) {
        return HttpResponse.json(validationErrors, { status: 400 });
      }
      
      return HttpResponse.json(transformToApiFormat(caseItem));
    })
  ];
}
