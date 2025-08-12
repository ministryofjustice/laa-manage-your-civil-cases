import { checkSchema } from 'express-validator';
import { TypedValidationError } from '#src/scripts/helpers/ValidationErrorHelpers.js';

/**
 * Validation middleware for search form input.
 * Ensures the search keyword is not empty using express-validator's built-in notEmpty validator
 * @returns {ReturnType<typeof checkSchema>} Validation schema for express-validator
 */
export const validateSearchInput = (): ReturnType<typeof checkSchema> =>
  checkSchema({
    searchKeyword: {
      in: ['body'],
      trim: true,
      notEmpty: {
        /**
         * Custom error message for empty search keyword
         * @returns {TypedValidationError} Returns TypedValidationError with structured error data
         */
        errorMessage: () => new TypedValidationError({
          summaryMessage: 'Enter at least one search criteria',
          inlineMessage: 'Enter search criteria'
        })
      }
    }
  });
