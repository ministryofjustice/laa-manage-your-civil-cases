import { checkSchema } from 'express-validator';
import { createChangeDetectionValidator, TypedValidationError, t } from '#src/scripts/helpers/index.js';

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
         * Custom error message for invalid e-mail format
         * @returns {TypedValidationError} Returns TypedValidationError with structured error data
         */
        errorMessage: () => new TypedValidationError({
          summaryMessage: t('forms.clientDetails.email.validationError.invalidFormat'),
          inlineMessage: t('forms.clientDetails.email.validationError.invalidFormat')
        })
      },
    },
    notChanged: createChangeDetectionValidator(
      [{ current: 'emailAddress', original: 'existingEmailAddress' }],
      {
        /**
         * Returns the summary message for unchanged email address.
         * @returns {string} Localized validation error message
         */
        summaryMessage: () => t('forms.clientDetails.email.validationError.notChanged'),
        inlineMessage: ''
      }
    ),
  });
