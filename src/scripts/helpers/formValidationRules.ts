import type { ReturnValidation, ValidationFields } from '#types/form-validation.js';

/**
 * Returns an array of validation rules for client details.
 * @param {ValidationFields} fields - The fields to validate.
 * @returns {Array<{ isInvalid: boolean; text: string, fieldName?: string, href?: string }> } The validation rules.
 */
export function getValidatedFormResult(fields: ValidationFields): ReturnValidation[] {
  const validations: ReturnValidation[] = [];

  return validations;
}
