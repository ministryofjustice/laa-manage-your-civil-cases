import type { ReturnValidation, ValidationFields } from '#types/form-validation.js';

/**
 * Returns an array of validation rules for client details.
 * @param {ValidationFields} fields - The fields to validate.
 * @returns {Array<{ isInvalid: boolean; text: string, fieldName?: string, href?: string }> } The validation rules.
 */
export function getValidatedFormResult(fields: ValidationFields): ReturnValidation[] {
  const validations: ReturnValidation[] = [];

  if (typeof fields.fullName === 'string' && typeof fields.existingFullName === 'string') {
    const fullNameEmpty = fields.fullName.trim() === '';
    const fullNameUnchanged = fields.fullName === fields.existingFullName;

    validations.push(
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
      }
    );
  }

  if (typeof fields.emailAddress === 'string' && typeof fields.existingEmail === 'string') {
    /**
     * Email validation using regex
     * @param {string} email - The email to check
     * @returns {boolean} returns boolean, as to whether the email matches the validation
     */
    function isValidEmail(email: string): boolean {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    }

    const emailEmpty = fields.emailAddress.trim() === '';
    const emailUnchanged = !emailEmpty && fields.emailAddress === fields.existingEmail;
    const emailFormatNotValid = !emailEmpty && !isValidEmail(fields.emailAddress);

    validations.push(
      {
        isInvalid: emailUnchanged,
        errorSummary: {
          text: "Enter the client email address, or select ‘Cancel'",
          href: '#emailAddress',
        },
        inputError: {
          text: "Enter the client email address, or select ‘Cancel’",
          fieldName: 'emailAddress'
        }
      },
      {
        isInvalid: emailFormatNotValid,
        errorSummary: {
          text: "Enter an email address in the correct format, like name@example.com",
          href: '#emailAddress',
        },
        inputError: {
          text: "Enter an email address in the correct format, like name@example.com",
          fieldName: 'emailAddress'
        }
      }
    );
  }

  return validations;
}
