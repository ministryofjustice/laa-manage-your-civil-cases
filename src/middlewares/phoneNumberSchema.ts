import { hasProperty, isRecord } from '#src/scripts/helpers/dataTransformers.js';
import { checkSchema, type Meta } from 'express-validator';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { TypedValidationError } from '#src/scripts/helpers/ValidationErrorHelpers.js';

interface ClientPhoneNumberBody {
  phoneNumber: string;
  existingPhoneNumber: string;
  safeToCall: boolean;
  existingSafeToCall: boolean;
  announceCall: boolean;
  existingAnnounceCall: boolean;
}

/**
 * Checks whether the given body object has the expected structure of ClientPhoneNumberBody.
 * @param {unknown} body - The body object to check
 * @returns {body is ClientPhoneNumberBody} True if the body matches ClientPhoneNumberBody shape
 */
function isClientPhoneNumberBody(body: unknown): body is ClientPhoneNumberBody {
  return isRecord(body) &&
    hasProperty(body, 'phoneNumber') &&
    hasProperty(body, 'existingPhoneNumber') &&
    hasProperty(body, 'safeToCall') &&
    hasProperty(body, 'existingSafeToCall') &&
    hasProperty(body, 'announceCall') &&
    hasProperty(body, 'existingAnnounceCall');
};

/**
 * Validation middleware when user edits client's phone number.
 * Ensures the phone number is present and valid (UK or International),and checks whether either phone number or "safe to call" status has changed
 * @returns {Error} Validation schema for express-validator
 */
export const validateEditClientPhoneNumber = (): ReturnType<typeof checkSchema> =>
  checkSchema({
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
          summaryMessage: 'Enter the phone number in the correct format',
          inlineMessage: 'Enter the phone number in the correct format'
        })
      },
      notEmpty: {
        /**
         * Custom error message for empty phone number
         * @returns {TypedValidationError} Returns TypedValidationError with structured error data
         */
        errorMessage: () => new TypedValidationError({
          summaryMessage: 'Enter the client phone number',
          inlineMessage: 'Enter the phone number'
        })
      },
    },
    notChanged: {
      in: ['body'],
      custom: {
        /**
         * Schema to check if the phoneNumber or safeToCall values have been unchanged.
         * @param {string} _value - Placeholder value (unused)
         * @param {Meta} meta - `express-validator` context containing request object
         * @returns {boolean} True if phoneNumber or safeToCall has changed
         */
        options: (_value: string, meta: Meta): boolean => {
          const { req } = meta;
          if (!isClientPhoneNumberBody(req.body)) {
            return true;
          }
          const phoneChanged = req.body.phoneNumber !== req.body.existingPhoneNumber;
          const safeToCallChanged = req.body.safeToCall !== req.body.existingSafeToCall;
          const announceCallChanged = req.body.announceCall !== req.body.existingAnnounceCall;
          return phoneChanged || safeToCallChanged || announceCallChanged;
        },
        /**
         * Custom error message for when no changes are made
         * @returns {TypedValidationError} Returns TypedValidationError with structured error data
         */
        errorMessage: () => new TypedValidationError({
          summaryMessage: 'Change information on the page, or select \'Cancel\'',
          inlineMessage: '',
        })
      },
    },
  });
