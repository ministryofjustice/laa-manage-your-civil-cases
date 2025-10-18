import { checkSchema } from 'express-validator';
import { TypedValidationError, t } from '#src/scripts/helpers/index.js';

/**
 * Validation middleware for login form input.
 * @returns {Error} Validation schema for express-validator
 */
export const validateLoginDetails = (): ReturnType<typeof checkSchema> =>
  checkSchema({
    username: {
      trim: true,
      notEmpty: {
        /**
         * Custom error message for empty username
         * @returns {TypedValidationError} Returns TypedValidationError with structured error data
         */
        errorMessage: () => new TypedValidationError({
          summaryMessage: t('forms.login.validationError.usernameEmpty'),
          inlineMessage: t('forms.login.validationError.usernameEmpty')
        })
      },
    },
    password: {
      trim: true,
      notEmpty: {
        /**
         * Custom error message for empty password
         * @returns {TypedValidationError} Returns TypedValidationError with structured error data
         */
        errorMessage: () => new TypedValidationError({
          summaryMessage: t('forms.login.validationError.passwordEmpty'),
          inlineMessage: t('forms.login.validationError.passwordEmpty')
        })
      },
    }
  });