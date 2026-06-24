import { checkSchema } from 'express-validator';
import { TypedValidationError, t } from '#src/scripts/helpers/index.js';

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
          summaryMessage: t('forms.clientDetails.name.validationError.notEmpty'),
          inlineMessage: t('forms.clientDetails.name.validationError.notEmpty')
        })
      },
    },
  });
