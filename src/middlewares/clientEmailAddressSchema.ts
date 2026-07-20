import { checkSchema } from 'express-validator';
import { TypedValidationError, t } from '#src/scripts/helpers/index.js';

/**
 * Validation middleware when user edits client's email address.
 * @returns {Error} Validation schema for express-validator
 */
export const validateEditClientEmailAddress = (): ReturnType<typeof checkSchema> =>
  checkSchema({
    emailAddress: {
      trim: true,
      optional: { options: { checkFalsy: true } },
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
