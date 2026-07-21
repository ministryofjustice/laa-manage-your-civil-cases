import { checkSchema } from 'express-validator';
import { TypedValidationError, t } from '#src/scripts/helpers/index.js';
import validator from 'validator';

/**
 * Validation middleware when user edits client's email address.
 * @returns {Error} Validation schema for express-validator
 */
export const validateEditClientEmailAddress = (): ReturnType<typeof checkSchema> =>
  checkSchema({
    emailAddress: {
      trim: true,
      optional: { options: { checkFalsy: true } },
      customSanitizer: {
        /**
         * Normalises the email address only when it is a valid email
         * @param {string} value The email address to sanitise
         * @returns {string} The normalized email address if valid; otherwise the original value.
         */
        options: (value: string) => validator.isEmail(value) ? validator.normalizeEmail(value) ?? value : value,
      },
      isEmail: {
        /**
         * Custom error message for invalid e-mail format
         * @returns {TypedValidationError} Returns TypedValidationError with structured error data
         */
        errorMessage: () => new TypedValidationError({
          summaryMessage: t('forms.clientDetails.email.validationError.invalidFormat'),
          inlineMessage: t('forms.clientDetails.email.validationError.invalidFormat')
        })
      }
    },
  });