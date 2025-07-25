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
        text: "Client name cannot be empty",
        href: '#fullName',
      },
      inputError: {
        text: "Enter the client's full name",
        fieldName: 'fullName'
      }
    },
    {
      isInvalid: fullNameUnchanged,
      errorSummary: {
        text: "You cannot save changes as you have not changed anything. You can make a change and save it, or select cancel.",
        href: '#fullName',
      },
      inputError: {
        text: "Enter the client's full name.",
        fieldName: 'fullName'
      }
    },
  ];
}
