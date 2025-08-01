import type { ReturnValidation, ValidationFields } from '#types/form-validation.js';
import { isValidPhoneNumber } from 'libphonenumber-js';

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

  if (typeof fields.phoneNumber === 'string' && typeof fields.existingPhoneNumber === 'string') {
    /**
     * Phone number regex validation
     * Accepts digits, spaces, dashes, and starts with optional + or 0
     * E.g., +447986512345, 07986 512345, 020-7946-0018
     * @param {string} phoneNumber - The phone number to check
     * @returns {boolean} returns boolean, as to whether the phone number matches the validation
     * 
     */
    function isValidUKPhoneNumber(phoneNumber: string): boolean {
      const phoneNumberRegex = /^(\+?\d{1,3})?[-\s]?\(?\d{2,5}\)?[-\s]?\d{3,5}[-\s]?\d{3,5}$/;
      return phoneNumberRegex.test(phoneNumber.trim());
    }

    const phoneNumberEmpty = fields.phoneNumber.trim() === '';
    const phoneNumberFormatNotValid = !phoneNumberEmpty && !isValidUKPhoneNumber(fields.phoneNumber) && !isValidPhoneNumber(fields.phoneNumber, 'IN');
    const phoneNumberUnchanged = fields.phoneNumber === fields.existingPhoneNumber;
    const safeToCallUnchanged = !phoneNumberFormatNotValid && !phoneNumberEmpty && fields.safeToCall === fields.existingSafeToCall;
    const combinedSafeToCallAndPhoneNumberUnchanged = phoneNumberUnchanged && safeToCallUnchanged

    validations.push(
      {
        isInvalid: combinedSafeToCallAndPhoneNumberUnchanged,
        errorSummary: {
          text: "Update if the client is safe to call, update the client phone number, or select ‘Cancel’",
          href: '#safeToCall',
        },
        inputError: {
          text: "Update if the client is safe to call, update the client phone number, or select ‘Cancel’",
          fieldName: 'safeToCall'
        }
      },
      {
        isInvalid: combinedSafeToCallAndPhoneNumberUnchanged,
        errorSummary: {
          text: "Update if the client is safe to call, update the client phone number, or select ‘Cancel’",
          href: '#phoneNumber',
        },
        inputError: {
          text: "Update if the client is safe to call, update the client phone number, or select ‘Cancel’",
          fieldName: 'phoneNumber'
        }
      },
      {
        isInvalid: phoneNumberEmpty,
        errorSummary: {
          text: "Enter the client phone number",
          href: '#phoneNumber',
        },
        inputError: {
          text: "Enter the phone number",
          fieldName: 'phoneNumber'
        }
      },
      {
        isInvalid: phoneNumberFormatNotValid,
        errorSummary: {
          text: "Enter a valid phone number",
          href: '#phoneNumber',
        },
        inputError: {
          text: "Enter a valid phone number",
          fieldName: 'phoneNumber'
        }
      }
    );
  }

  return validations;
}
