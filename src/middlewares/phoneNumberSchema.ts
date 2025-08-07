import { checkSchema, type Meta } from 'express-validator';
import { isValidPhoneNumber } from 'libphonenumber-js';

interface ClientPhoneNumberBody {
  phoneNumber: string;
  existingPhoneNumber: string;
  safeToCall: boolean;
  existingSafeToCall: boolean;
}

/**
 * Checks whether the given body object has the expected structure of ClientPhoneNumberBody.
 * @param {unknown} body - The body object to check
 * @returns {body is ClientPhoneNumberBody} True if the body matches ClientPhoneNumberBody shape
 */
function isClientPhoneNumberBody(body: unknown): body is ClientPhoneNumberBody {
  return (
    typeof body === 'object' &&
    body !== null &&
    'phoneNumber' in body &&
    'existingPhoneNumber' in body &&
    'safeToCall' in body &&
    'existingSafeToCall' in body
  );
}

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
         * Schema to check if the number inputted is empty and/or valid UK or International phone number.
         * @param {string} numberInputted - The number user has inputted
         * @returns {true} Returns true if the phone number is valid
         * @throws {Error} Throws error with a user-friendly message if invalid
         */
        options: (numberInputted: string): true => {
          if (numberInputted.trim() === '') {
            const errorData = {
              fieldName: 'phoneNumber',
              summaryMessage: 'Enter the client phone number',
              inlineMessage: 'Enter the phone number'
            };
            throw new Error(JSON.stringify(errorData));
          }

          const valid = isValidPhoneNumber(numberInputted, 'GB') || isValidPhoneNumber(numberInputted, 'IN');
          if (!valid) {
            const errorData = {
              fieldName: 'phoneNumber',
              summaryMessage: 'Enter the phone number in the correct format',
              inlineMessage: 'Enter the phone number in the correct format'
            };
            throw new Error(JSON.stringify(errorData));
          }

          return true;
        },
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
        options: (_value: string, meta: Meta ): boolean => {
          const {req} = meta;
          if (!isClientPhoneNumberBody(req.body)) {
            return true;
          }
          const phoneChanged = req.body.phoneNumber !== req.body.existingPhoneNumber;
          const safeToCallChanged = req.body.safeToCall !== req.body.existingSafeToCall;
          if (!phoneChanged && !safeToCallChanged) {
            const errorData = {
              fieldName: 'phoneNumber',
              summaryMessage: 'Update if the client is safe to call, update the client phone number, or select ‘Cancel’',
              inlineMessage: '',
            };
            throw new Error(JSON.stringify(errorData));
          }
          return true;
        },
      },
    },
  });