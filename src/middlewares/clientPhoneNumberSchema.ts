import { checkSchema } from 'express-validator';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { createChangeDetectionValidator, TypedValidationError, t } from '#src/scripts/helpers/index.js';

/**
 * Validation middleware when user edits client's phone number.
 * Ensures the phone number is present and valid (UK or International),and checks whether either phone number or "safe to call" status has changed
 * @returns {Error} Validation schema for express-validator
 */
export const validateEditClientPhoneNumber = (): ReturnType<typeof checkSchema> => {
  return checkSchema({
    phoneNumber: {
      in: ['body'],
      trim: true,
      custom: {
        /**
         * Schema to check if the number inputted is valid UK or International phone number.
         * @param {string} numberInputted - The number user has inputted
         * @returns {boolean} Returns true if the phone number is valid, false otherwise
         */
        options: (numberInputted: string): boolean => {
          if (numberInputted.trim() === '') {
            return true; // Let the notEmpty validator handle empty values
          }

          const valid = isValidPhoneNumber(numberInputted, 'GB') || isValidPhoneNumber(numberInputted, 'IN');
          return valid;
        },
        /**
         * Custom error message for invalid phone number format
         * @returns {TypedValidationError} Returns TypedValidationError with structured error data
         */
        errorMessage: () => new TypedValidationError({
          summaryMessage: t('forms.clientDetails.phoneNumber.validationError.invalidFormat'),
          inlineMessage: t('forms.clientDetails.phoneNumber.validationError.invalidFormat')
        })
      },
      notEmpty: {
        /**
         * Custom error message for empty phone number
         * @returns {TypedValidationError} Returns TypedValidationError with structured error data
         */
        errorMessage: () => new TypedValidationError({
          summaryMessage: t('forms.clientDetails.phoneNumber.validationError.notEmpty'),
          inlineMessage: t('forms.clientDetails.phoneNumber.validationError.notEmpty')
        })
      },
    },
    notChanged: createChangeDetectionValidator(
      [
        { current: 'phoneNumber', original: 'existingPhoneNumber' },
        { current: 'safeToCall', original: 'existingSafeToCall' },
        { current: 'announceCall', original: 'existingAnnounceCall' }
      ],
      {
        /**
         * Returns the summary message for unchanged phone number or call status.
         * @returns {string} Localized validation error message
         */
        summaryMessage: () => t('forms.clientDetails.phoneNumber.validationError.notChanged'),
        inlineMessage: ''
      }
    ),
  });
};
