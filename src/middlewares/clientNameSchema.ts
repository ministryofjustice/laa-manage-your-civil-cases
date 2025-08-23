import { checkSchema } from 'express-validator';
import { createChangeDetectionValidator, TypedValidationError } from '#src/scripts/helpers/ValidationErrorHelpers.js';

/**
 * Validation middleware when user edits client's name.
 * @returns {Error} Validation schema for express-validator
 */
export const validateEditClientName = (): ReturnType<typeof checkSchema> =>
  checkSchema({
    fullName: {
      trim: true,
      notEmpty: {
        /**
         * Custom error message for empty client name
         * @returns {TypedValidationError} Returns TypedValidationError with structured error data
         */
        errorMessage: () => new TypedValidationError({
          summaryMessage: 'Enter the client name',
          inlineMessage: 'Enter the client name'
        })
      },
      ...createChangeDetectionValidator(
        [{ current: 'fullName', original: 'existingFullName' }],
        {
          summaryMessage: "Enter the client name, or select 'Cancel'",
          inlineMessage: "Enter the client name, or select 'Cancel'",
        }),
      }
    });
