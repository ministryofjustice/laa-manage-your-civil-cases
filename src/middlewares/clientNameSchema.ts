import { checkSchema } from 'express-validator';
import { TypedValidationError, t } from '#src/scripts/helpers/index.js';
import config from '#config.js';

const { MAX_NAME_LENGTH } = config;

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
      isLength: {
        options: { max: MAX_NAME_LENGTH },
        /**
         * Custom error message for comment exceeding max length
         * @returns {TypedValidationError} Returns TypedValidationError with structured error data
         */
        errorMessage: () => new TypedValidationError({
          summaryMessage: t('forms.clientDetails.name.validationError.isLength'),
          inlineMessage: t('forms.clientDetails.name.validationError.isLength')
        })
      }
    },
  });
