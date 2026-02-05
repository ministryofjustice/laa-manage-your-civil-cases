/**
 * Personal Details endpoint handlers
 */

import { http, HttpResponse } from 'msw';
import type { MockCase } from './types.js';
import { transformToApiFormat } from './utils.js';
import {
  validateStringField,
  validateNullableBooleanField,
  validateChoiceField
} from './validationHelpers.js';

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
        return HttpResponse.json({ error: 'Case not found' }, { status: 404 });
      }

      // Validate request data structure
      const validationErrors: Record<string, string[]> = {};

      if (typeof updateData !== 'object' || updateData === null || Array.isArray(updateData)) {
        return HttpResponse.json({ detail: 'Invalid request body format' }, { status: 400 });
      }

      // Validate string fields with max length
      validateStringField(updateData, 'full_name', 400, validationErrors);
      validateStringField(updateData, 'postcode', 12, validationErrors);
      validateStringField(updateData, 'street', 255, validationErrors);
      validateStringField(updateData, 'mobile_phone', 20, validationErrors);
      validateStringField(updateData, 'home_phone', 20, validationErrors);

      // Validate email field
      if ('email' in updateData) {
        if (typeof updateData.email !== 'string') {
          validationErrors.email = ['Must be a string'];
        } else if (updateData.email.length > 0) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(updateData.email)) {
            validationErrors.email = ['Enter a valid email address.'];
          }
        }
      }

      // Validate choice field
      validateChoiceField(updateData, 'safe_to_contact', ['SAFE', 'DONT_CALL'], validationErrors);

      // Validate nullable boolean field
      validateNullableBooleanField(updateData, 'announce_call', validationErrors);

      // Validate date of birth
      if ('dob' in updateData) {
        if (typeof updateData.dob !== 'object' || updateData.dob === null) {
          validationErrors.dob = ['Must be an object with day, month, year'];
        } else {
          const { day, month, year } = updateData.dob;
          if (!day || !month || !year) {
            validationErrors.dob = ['Must include day, month, and year'];
          }
        }
      }

      if (Object.keys(validationErrors).length > 0) {
        return HttpResponse.json(validationErrors, { status: 400 });
      }

      if ('full_name' in updateData) {
        caseItem.fullName = updateData.full_name;
      }
      
      return HttpResponse.json(transformToApiFormat(caseItem));
    })
  ];
}
