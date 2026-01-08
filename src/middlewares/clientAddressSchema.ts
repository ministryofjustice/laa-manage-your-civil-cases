import { checkSchema } from 'express-validator';
import { createChangeDetectionValidator } from '#src/scripts/helpers/ValidationErrorHelpers.js';
import { TypedValidationError, t } from '#src/scripts/helpers/index.js';
import config from '#config.js';

const { MAX_POSTCODE_LENGTH }: { MAX_POSTCODE_LENGTH: number } = config;

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
    /**
     * Postcode field validation and sanitisation.
     * Converts postcode to uppercase for consistency.
     * @param {string} value - The postcode value to sanitise.
     * @returns {string} The sanitised postcode in uppercase, or the original value if not a string.
     */
    postcode: {
      in: ['body'],
      trim: true,
      customSanitizer: {
        /**
         * Sanitises the postcode value to uppercase.
         * @param {string} value - The postcode value to sanitise.
         * @returns {string} The sanitised postcode in uppercase, or the original value if not a string.
         */
        options: (value: string) => typeof value === 'string' ? value.toUpperCase() : value
      },
      isLength: {
        options: { max: MAX_POSTCODE_LENGTH },
        /**
         * Custom error message for postcode exceeding max length
         * @returns {TypedValidationError} Returns TypedValidationError with structured error data
         */
        errorMessage: () => new TypedValidationError({
          summaryMessage: t('forms.clientDetails.address.validationError.isLength'),
          inlineMessage: t('forms.clientDetails.address.validationError.isLength')
        })
      }
    },
    notChanged: createChangeDetectionValidator(
      [
        { current: 'address', original: 'existingAddress' },
        { current: 'postcode', original: 'existingPostcode' }
      ],
      {
        // Use a thunk so translation happens at validation time
        /**
         * Provides the summary error message for unchanged address fields.
         * Uses translation at validation time.
         * @returns {string} Translated summary error message
         */
        summaryMessage: () => t('forms.clientDetails.address.validationError.notChanged'),
        inlineMessage: ''
      }
    ),
  });
