import { checkSchema } from 'express-validator';
import { TypedValidationError, t } from '#src/scripts/helpers/index.js';

const nationalInsuranceNumberPattern = /^(?!BG)(?!GB)(?!NK)(?!KN)(?!TN)(?!NT)(?!ZZ)[A-CEGHJ-PR-TW-Z][A-CEGHJ-NPR-TW-Z]\d{6}[A-DFM]$/i;

/**
 * Validation middleware when user edits client's national insurance number
 * @returns {Error} Validation schema for express-validator
 */
export const validateEditClientNationalInsuranceNumber = (): ReturnType<typeof checkSchema> =>
  checkSchema({
    nationalInsuranceNumber: {
      trim: true,
      customSanitizer: {
        /**
         * Removes whitespace and converts a National Insurance number to uppercase
         * @param {string} value - The National Insurance number to normalise
         * @returns {string} The normalised National Insurance number
         */
        options: (value: string) => value.replace(/[^a-z0-9]/gi, '').toUpperCase()
      },
      custom: {
        /**
         * Allows an empty value or validates a National Insurance number format
         * @param {string} value - The normalised National Insurance number
         * @returns {boolean} Whether the value is empty or a valid National Insurance number
         */
        options: (value: string): boolean =>
          value === '' || nationalInsuranceNumberPattern.test(value),
        /**
         * Builds the validation error shown for an invalid National Insurance number
         * @returns {TypedValidationError} A structured validation error
         */
        errorMessage: () => new TypedValidationError({
          summaryMessage: t('forms.clientDetails.nationalInsuranceNumber.validationError.invalidFormat'),
          inlineMessage: t('forms.clientDetails.nationalInsuranceNumber.validationError.invalidFormat')
        })
      }
    }
  });
