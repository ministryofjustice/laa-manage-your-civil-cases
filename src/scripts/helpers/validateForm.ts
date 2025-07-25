import { safeString, isRecord } from './dataTransformers.js';
import { getValidatedFormResult } from './formValidationRules.js';
import type { ValidationFields, ValidationResult } from '#types/form-validation.js';

const ZERO_INDEX = 0;

/**
 * Validates the form fields based on defined validation rules.
 * @param {ValidationFields} fields - The fields to validate.
 * @returns {object} An object containing validation results.
 */
export function validateForm(fields: ValidationFields): ValidationResult {

  const validatedRules = getValidatedFormResult(fields);

  // Extract error for each input error using forEach
  const inputErrors: Record<string, string> = {};
  const failedValidation = validatedRules.filter(rule => rule.isInvalid);

  failedValidation.forEach(obj => {
    if (obj.inputError !== undefined && isRecord(obj.inputError) && 'fieldName' in obj.inputError && 'text' in obj.inputError) {
      inputErrors[obj.inputError.fieldName] = safeString(obj.inputError.text);
    }
  });
  // Create error summary list from failed validation rules
  const errorSummaryList = failedValidation.map(rule => rule.errorSummary);

  return {
    inputErrors,
    errorSummaryList,
    formIsInvalid: failedValidation.length > ZERO_INDEX,
  };
}