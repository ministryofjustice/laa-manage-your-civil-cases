import type { ReturnValidation, ValidationFields } from '#types/form-validation.js';

/**
 * Returns an array of validation rules for client details.
 * @param {ValidationFields} fields - The fields to validate.
 * @returns {Array<{ isInvalid: boolean; text: string, fieldName?: string, href?: string }> } The validation rules.
 */
export function getValidatedFormResult(fields: ValidationFields): ReturnValidation[] {
  const fullNameEmpty = (fields.fullName.trim() === '');
  const fullNameUnchanged = (fields.fullName === fields.existingFullName);

  return [
    {
      isInvalid: fullNameEmpty,
      errorSummary: {
        text: "Enter the client name",
        href: '#fullName',
      },
      inputError: {
        text: "Enter the client name",
        fieldName: 'fullName'
      }
    },
    {
      isInvalid: fullNameUnchanged,
      errorSummary: {
        text: "Enter the client name, or select ‘Cancel'",
        href: '#fullName',
      },
      inputError: {
        text: "Enter the client name, or select ‘Cancel’",
        fieldName: 'fullName'
      }
    },
  ];
}
