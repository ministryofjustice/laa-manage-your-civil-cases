import { checkSchema } from 'express-validator';
import { TypedValidationError, t } from '#src/scripts/helpers/index.js';

/**
 * Validation middleware for login form input.
 * @returns {Error} Validation schema for express-validator
 */
export const validateLoginDetails = (): ReturnType<typeof checkSchema> =>
  checkSchema({
    username: {
      in: ['body'],
      trim: true,
      notEmpty: {
        /**
         * Custom error message for empty search keyword
         * @returns {TypedValidationError} Returns TypedValidationError with structured error data
         */
        errorMessage: () => new TypedValidationError({
          summaryMessage: t('forms.search.validationError.notEmpty'),
          inlineMessage: t('forms.search.validationError.notEmpty')
        })
      }
    },
    password: {
      in: ['body'],
      trim: true,
      notEmpty: {
        /**
         * Custom error message for empty search keyword
         * @returns {TypedValidationError} Returns TypedValidationError with structured error data
         */
        errorMessage: () => new TypedValidationError({
          summaryMessage: t('forms.search.validationError.notEmpty'),
          inlineMessage: t('forms.search.validationError.notEmpty')
        })
      }
    }
  });