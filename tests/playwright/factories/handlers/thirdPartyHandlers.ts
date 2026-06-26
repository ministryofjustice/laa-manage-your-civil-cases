/**
 * Third Party Details endpoint handlers
 */

import { http, HttpResponse } from 'msw';
import type { MockCase } from './types.js';
import { transformToApiFormat } from './utils.js';
import { validatePersonalDetails, validateThirdPartyFields } from './validationHelpers.js';
import { HTTP } from '#src/services/api/base/constants.js';

export function createThirdPartyHandlers(
  API_BASE_URL: string,
  API_PREFIX: string,
  cases: MockCase[]
) {
  return [
    // PATCH /case/:caseReference/thirdparty_details/
    http.patch(`${API_BASE_URL}${API_PREFIX}/case/:caseReference/thirdparty_details/`, async ({ params, request }) => {
      const { caseReference } = params;
      const updateData = await request.json() as Record<string, any>;

      const caseItem = cases.find(c => c.caseReference === caseReference);
      if (!caseItem) {
        return HttpResponse.json({ error: 'Case not found' }, { status: HTTP.NOT_FOUND });
      }

      // Detect soft delete: personal_relationship = 'OTHER' with nested personal_details.full_name null and pass_phrase null
      const isSoftDelete = updateData.personal_relationship === 'OTHER' &&
        updateData.personal_details?.full_name === null &&
        updateData.pass_phrase === null;

      // Restrict the delete function to the required case, George Gregory
      if (isSoftDelete && caseReference === 'PC-3152-7329') {
        // Return a copy with thirdParty removed - don't mutate shared state
        caseItem.thirdParty = null;
        return HttpResponse.json(transformToApiFormat(caseItem));
      }

      const validationErrors: Record<string, any> = {};
      if (typeof updateData !== 'object' || updateData === null || Array.isArray(updateData)) {
        return HttpResponse.json({ detail: 'Invalid request body format' }, { status: HTTP.BAD_REQUEST });
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
        return HttpResponse.json(validationErrors, { status: HTTP.BAD_REQUEST });
      }

      // Restrict it to the required test case, Jack Youngs
      if (caseReference === 'PC-1922-1879') {
        caseItem.thirdParty = { 
          fullName: updateData.personal_details?.full_name ?? '',
          emailAddress:updateData.personal_details?.email ?? '',
          contactNumber: updateData.contact_number ?? updateData.personal_details?.mobile_phone ?? updateData.mobile_phone ?? '',
          safeToCall: true,
          address: updateData.personal_details?.street ?? updateData.personal_details?.address ?? '',
          postcode: updateData.personal_details?.postcode ?? '',
          relationshipToClient: { selected: [updateData.personal_relationship] },
          passphraseSetUp: { selected: [updateData.thirdPartyPassphraseSetUp], passphrase: updateData.pass_phrase ?? updateData.thirdPartyPassphrase ?? undefined }
        };
      }
      return HttpResponse.json(transformToApiFormat(caseItem));
    }),

    // POST /case/:caseReference/thirdparty_details/
    http.post(`${API_BASE_URL}${API_PREFIX}/case/:caseReference/thirdparty_details/`, async ({ params, request }) => {
      const { caseReference } = params;
      const thirdPartyData = await request.json() as Record<string, any>;
      console.log(`[MSW] Intercepting POST /case/${caseReference}/thirdparty_details/`);

      const caseItem = cases.find(c => c.caseReference === caseReference);

      if (!caseItem) {
        console.log(`[MSW] Case ${caseReference} not found in mock data (POST thirdparty_details)`);
        return HttpResponse.json({ error: 'Case not found' }, { status: HTTP.NOT_FOUND });
      }

      const validationErrors: Record<string, any> = {};

      if (typeof thirdPartyData !== 'object' || thirdPartyData === null || Array.isArray(thirdPartyData)) {
        return HttpResponse.json({ detail: 'Invalid request body format' }, { status: HTTP.BAD_REQUEST });
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
        return HttpResponse.json(validationErrors, { status: HTTP.BAD_REQUEST });
      }

      // Restrict updating the 3rd party to the required test case James Potter
      if (caseReference === 'PC-1357-1212') {
        caseItem.thirdParty = {
          fullName: thirdPartyData.personal_details?.full_name ?? '',

          emailAddress:
            thirdPartyData.personal_details?.email ?? '',

          contactNumber:
            thirdPartyData.contact_number ??
            thirdPartyData.personal_details?.mobile_phone ??
            thirdPartyData.mobile_phone ??
            '',

          safeToCall: true,

          address:
            thirdPartyData.personal_details?.street ??
            thirdPartyData.personal_details?.address ??
            '',

          postcode:
            thirdPartyData.personal_details?.postcode ?? '',

          relationshipToClient: {
            selected: [thirdPartyData.personal_relationship]
          },

          passphraseSetUp: {
            selected: thirdPartyData.pass_phrase ? ['YES'] : ['NO'],
            passphrase: thirdPartyData.pass_phrase ?? undefined
          }
        };
      }

      console.log(`[MSW] Returning updated case data for ${caseReference} (POST thirdparty_details)`);
      return HttpResponse.json(transformToApiFormat(caseItem), { status: 201 });
    }),

    // PUT /case/:caseReference/thirdparty_details/
    http.put(`${API_BASE_URL}${API_PREFIX}/case/:caseReference/thirdparty_details/`, async ({ params, request }) => {
      const { caseReference } = params;
      const thirdPartyData = await request.json() as Record<string, any>;

      const caseItem = cases.find(c => c.caseReference === caseReference);
      if (!caseItem) {
        return HttpResponse.json({ error: 'Case not found' }, { status: HTTP.NOT_FOUND });
      }

      const validationErrors: Record<string, any> = {};

      if (typeof thirdPartyData !== 'object' || thirdPartyData === null || Array.isArray(thirdPartyData)) {
        return HttpResponse.json({ detail: 'Invalid request body format' }, { status: HTTP.BAD_REQUEST });
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
        return HttpResponse.json(validationErrors, { status: HTTP.BAD_REQUEST });
      }
      return HttpResponse.json(transformToApiFormat(caseItem));
    })
  ];
}