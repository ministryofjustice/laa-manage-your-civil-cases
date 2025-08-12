import { hasProperty, isRecord } from '#src/scripts/helpers/dataTransformers.js';
import { checkSchema, type Meta } from 'express-validator';
import { TypedValidationError } from '#src/scripts/helpers/ValidationErrorHelpers.js';

interface ClientAddressBody {
  address: string;
  postcode: string;
  existingAddress: string;
  existingPostcode: string;
}

/**
 * Checks whether the given body object has the expected structure of ClientAddressBody.
 * @param {unknown} body - The body object to check
 * @returns {body is ClientAddressBody} True if the body matches ClientAddressBody shape
 */
function isClientAddressBody(body: unknown): body is ClientAddressBody {
  return isRecord(body) &&
    hasProperty(body, 'address') &&
    hasProperty(body, 'postcode') &&
    hasProperty(body, 'existingAddress') &&
    hasProperty(body, 'existingPostcode');
}

/**
 * Validation middleware when user edits client's contact address.
 * Validates address and postcode fields with postcode uppercase conversion and change detection.
 * @returns {Error} Validation schema for express-validator
 */
export const validateEditClientAddress = (): ReturnType<typeof checkSchema> =>
  checkSchema({
    address: {
      in: ['body'],
      trim: true,
    },
    postcode: {
      in: ['body'],
      trim: true,
      customSanitizer: {
        /**
         * Converts postcode to uppercase for consistent formatting
         * @param {string} value - The postcode value to convert
         * @returns {string} The postcode in uppercase
         */
        options: (value: string) => 
          // Convert postcode to uppercase if provided
           typeof value === 'string' ? value.toUpperCase() : value
        
      },
    },
    notChanged: {
      in: ['body'],
      custom: {
        /**
         * Schema to check if the address or postcode values have been unchanged (AC5).
         * @param {string} _value - Placeholder value (unused)
         * @param {Meta} meta - `express-validator` context containing request object
         * @returns {boolean} True if address or postcode has changed
         */
        options: (_value: string, meta: Meta): boolean => {
          const { req } = meta;
          if (!isClientAddressBody(req.body)) {
            return true;
          }
          
          const addressChanged = req.body.address.trim() !== req.body.existingAddress.trim();
          const postcodeChanged = req.body.postcode.trim() !== req.body.existingPostcode.trim();
          
          return addressChanged || postcodeChanged;
        },
        /**
         * Custom error message for when no changes are made (AC5)
         * @returns {TypedValidationError} Returns TypedValidationError with structured error data
         */
        errorMessage: () => new TypedValidationError({
          summaryMessage: 'Update the client address, update the postcode, or select \'Cancel\'',
          inlineMessage: '',
        })
      },
    },
  });
