import { checkSchema } from 'express-validator';
import { isValidPhoneNumber } from 'libphonenumber-js';
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
      },
    },
    thirdPartyContactNumber: {
      trim: true,
      optional: { options: { checkFalsy: true } },
      custom: {
        /**
         * Schema to check if the number inputted is valid UK or International phone number.
         * @param {string} numberInputted - The number user has inputted
         * @returns {boolean} Returns true if the phone number is valid, false otherwise
         */
        options: (numberInputted: string): boolean => {
          if (numberInputted.trim() === '') {
            return true;
          }

          const valid = isValidPhoneNumber(numberInputted, 'GB') || isValidPhoneNumber(numberInputted, 'IN');
          return valid;
        },
        /**
         * Custom error message for invalid phone number format
         * @returns {TypedValidationError} Returns TypedValidationError with structured error data
         */
        errorMessage: () => new TypedValidationError({
          summaryMessage: t('forms.clientDetails.thirdParty.validationError.invalidFormatContactNumber'),
          inlineMessage: t('forms.clientDetails.thirdParty.validationError.invalidFormatContactNumber')
        }),
      },
    },
    thirdPartyAddress: {
      trim: true,
      optional: { options: { checkFalsy: true } },
    },
    thirdPartyPostcode: {
      trim: true,
      optional: { options: { checkFalsy: true } },
      customSanitizer: {
        /**
         * Sanitises the postcode value to uppercase.
         * @param {string} value - The postcode value to sanitise.
         * @returns {string} The sanitised postcode in uppercase, or the original value if not a string.
         */
        options: (value: string) => typeof value === 'string' ? value.toUpperCase() : value
      },
    },
  });
