import { checkSchema } from 'express-validator';
import { TypedValidationError } from '#src/scripts/helpers/index.js';
import { t } from '#src/scripts/helpers/localeLoader.js';

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
          summaryMessage: t.forms.search.validationError.notEmpty,
          inlineMessage: t.forms.search.validationError.notEmpty
        })
      }
    }
  });
