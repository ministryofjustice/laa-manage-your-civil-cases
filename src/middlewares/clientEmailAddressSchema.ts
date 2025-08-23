import { checkSchema } from 'express-validator';
import { createChangeDetectionValidator, TypedValidationError } from '#src/scripts/helpers/ValidationErrorHelpers.js';

/**
 * Validation middleware when user edits client's email address.
 * @returns {Error} Validation schema for express-validator
 */
export const validateEditClientEmailAddress = (): ReturnType<typeof checkSchema> =>
  checkSchema({
    emailAddress: {
      trim: true,
      optional: { options: { checkFalsy: true } },
      normalizeEmail: true,
      isEmail: {
        /**
         * Custom error message for invalid phone number format
         * @returns {TypedValidationError} Returns TypedValidationError with structured error data
         */
        errorMessage: () => new TypedValidationError({
          summaryMessage: 'Enter an email address in the correct format, like name@example.com',
          inlineMessage: 'Enter an email address in the correct format, like name@example.com'
        })
      },
      ...createChangeDetectionValidator(
        [{ current: 'emailAddress', original: 'existingEmailAddress' }],
        {
          summaryMessage: "Enter the client email address, or select 'Cancel'",
          inlineMessage: "Enter the client email address, or select 'Cancel'",
        }),
    }
  });
