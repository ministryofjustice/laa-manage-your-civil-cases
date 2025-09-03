import { checkSchema } from 'express-validator';
import { createChangeDetectionValidator, TypedValidationError, t } from '#src/scripts/helpers/index.js';

/**
 * Validation middleware when user edits client's third party form.
 * @returns {Error} Validation schema for express-validator
 */
export const validateEditClientThirdParty = (): ReturnType<typeof checkSchema> =>
  checkSchema({
    thirdPartyFullName: {
      trim: true,
      notEmpty: {
        /**
         * Custom error message for empty client third party name
         * @returns {TypedValidationError} Returns TypedValidationError with structured error data
         */
        errorMessage: () => new TypedValidationError({
          summaryMessage: t('forms.clientDetails.thirdParty.validationError.notEmptyName'),
          inlineMessage: t('forms.clientDetails.thirdParty.validationError.notEmptyName')
        }),
        bail: true,
      },
      ...createChangeDetectionValidator(
        [{ current: 'thirdPartyFullName', original: 'existingFullName' }],
        {
          /**
           * Returns the summary message for unchanged third party name.
           * @returns {string} Localized validation error message
           */
          summaryMessage: () => t('forms.clientDetails.thirdParty.validationError.notChangedName'),
          inlineMessage: '',
        }),
    },
    thirdPartyEmailAddress: {
      trim: true,
      optional: { options: { checkFalsy: true } },
      normalizeEmail: true,
      isEmail: {
        /**
         * Custom error message for invalid e-mail format
         * @returns {TypedValidationError} Returns TypedValidationError with structured error data
         */
        errorMessage: () => new TypedValidationError({
          summaryMessage: t('forms.clientDetails.thirdParty.validationError.invalidFormatEmail'),
          inlineMessage: t('forms.clientDetails.thirdParty.validationError.invalidFormatEmail')
        }),
        bail: true,
      },
      ...createChangeDetectionValidator(
        [{ current: 'thirdPartyEmailAddress', original: 'existingThirdPartyEmailAddress' }],
        {
          /**
           * Returns the summary message for unchanged third party name.
           * @returns {string} Localized validation error message
           */
          summaryMessage: () => t('forms.clientDetails.thirdParty.validationError.notChangedEmail'),
          inlineMessage: '',
        }),
    },
  });
