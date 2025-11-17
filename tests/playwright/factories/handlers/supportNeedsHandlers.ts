/**
 * Client Support Needs endpoint handlers
 */

import { http, HttpResponse } from 'msw';
import type { MockCase } from './types.js';
import { transformToApiFormat } from './utils.js';
import { validateBooleanField, validateNullableBooleanField } from './validationHelpers.js';

export function createSupportNeedsHandlers(
  API_BASE_URL: string,
  API_PREFIX: string,
  cases: MockCase[]
) {
  return [
    // PATCH /case/:caseReference/adaptation_details/
    http.patch(`${API_BASE_URL}${API_PREFIX}/case/:caseReference/adaptation_details/`, async ({ params, request }) => {
      const { caseReference } = params;
      const updateData = await request.json() as Record<string, any>;

      const caseItem = cases.find(c => c.caseReference === caseReference);
      
      if (!caseItem) {
        return HttpResponse.json({ error: 'Case not found' }, { status: 404 });
      }

      const validationErrors: Record<string, string[]> = {};

      if (typeof updateData !== 'object' || updateData === null || Array.isArray(updateData)) {
        return HttpResponse.json({ detail: 'Invalid request body format' }, { status: 400 });
      }

      // Validate boolean fields
      const booleanFields = ['bsl_webcam', 'minicom', 'text_relay', 'skype_webcam', 'callback_preference'];
      booleanFields.forEach(field => validateBooleanField(updateData, field, validationErrors));

      // Validate nullable boolean field
      validateNullableBooleanField(updateData, 'no_adaptations_required', validationErrors);
      
      // Validation for soft delete (remove support needs)
      if (updateData.no_adaptations_required === true) {
        
        // Verify all required fields are present for soft delete
        const requiredFields = ['bsl_webcam', 'minicom', 'text_relay', 'skype_webcam', 'callback_preference', 'language', 'notes'];
        const missingFields = requiredFields.filter(field => !(field in updateData));
        
        if (missingFields.length > 0) {
          validationErrors._soft_delete = [`Missing required fields: ${missingFields.join(', ')}`];
        }
        
        // Verify fields are properly cleared (all booleans false, language null, notes empty)
        const expectedClearPayload = {
          bsl_webcam: false,
          minicom: false,
          text_relay: false,
          skype_webcam: false,
          callback_preference: false,
          language: null,
          notes: '',
          no_adaptations_required: true
        };
        
        const incorrectFields = Object.entries(expectedClearPayload).filter(([key, expectedValue]) => {
          return updateData[key] !== expectedValue;
        });
        
        if (incorrectFields.length > 0) {
          validationErrors._soft_delete_values = incorrectFields.map(([key, expected]) => 
            `${key}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(updateData[key])}`
          );
        }
      }

      // Validate language field
      if ('language' in updateData) {
        if (updateData.language !== null && updateData.language !== '' && typeof updateData.language !== 'string') {
          validationErrors.language = ['Must be a string, empty string, or null'];
        } else if (typeof updateData.language === 'string' && updateData.language.length > 30) {
          validationErrors.language = ['Ensure this field has no more than 30 characters.'];
        }
      }

      // Validate notes field
      if ('notes' in updateData && typeof updateData.notes !== 'string') {
        validationErrors.notes = ['Must be a string'];
      }

      if (Object.keys(validationErrors).length > 0) {
        return HttpResponse.json(validationErrors, { status: 400 });
      }
      
      return HttpResponse.json(transformToApiFormat(caseItem));
    })
  ];
}

