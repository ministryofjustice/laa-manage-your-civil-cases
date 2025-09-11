import { checkSchema } from 'express-validator';
import type { Meta } from 'express-validator';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { TypedValidationError, t, safeBodyString, createSessionChangeDetectionValidator } from '#src/scripts/helpers/index.js';

/**
 * Base schema object for client third party validation.
 * Contains all validation rules for third party form fields.
 */
const clientThirdPartyBaseSchema = {
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
      })
    },
  },
  thirdPartyEmailAddress: {
    trim: true,
    optional: { options: { checkFalsy: true } },
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
  thirdPartyPassphraseSetUp: {
    notEmpty: {
      /**
       * Custom error message for empty radio selection for third party relationship to client
       * @returns {TypedValidationError} Returns TypedValidationError with structured error data
       */
      errorMessage: () => new TypedValidationError({
        summaryMessage: t('forms.clientDetails.thirdParty.validationError.notEmptyRelationship'),
        inlineMessage: t('forms.clientDetails.thirdParty.validationError.notEmptyRelationship')
      })
    },
  },
  thirdPartyPassphrase: {
    custom: {
      /**
       * This checks that the piked radio option is 'Yes'
       * @param {string} value - the value of the input field
       * @param {object} meta - metadata object containing request information
       * @param {object} meta.req - Express request object
       * @returns {boolean} Returns a decision as to whether we should apply validation
       */
      options: (value: string, meta: Meta) => {
        const yesRadio = t('common.yes');
        const picked = safeBodyString(meta.req.body, 'thirdPartyPassphraseSetUp');
        const EMPTY = 0;

        const needs = picked === yesRadio;
        if (!needs) return true;
        return typeof value === 'string' && value.length > EMPTY;
      },
    },
    /**
     * Custom error message for passphrase
     * @returns {TypedValidationError} Returns TypedValidationError with structured error data
     */
    errorMessage: () => new TypedValidationError({
      summaryMessage: t('forms.clientDetails.thirdParty.validationError.notEmptyPassphrase'),
      inlineMessage: t('forms.clientDetails.thirdParty.validationError.notEmptyPassphrase')
    }),
  },
};

/**
 * Validation middleware when user adds client's third party form.
 * @returns {Error} Validation schema for express-validator
 */
export const validateAddClientThirdParty = (): ReturnType<typeof checkSchema> =>
  checkSchema(clientThirdPartyBaseSchema);

/**
 * Validation middleware when user edits client's third party form.
 * Extends the add validation with session-based change detection to ensure modifications have been made.
 * @returns {Error} Validation schema for express-validator
 */
export const validateEditClientThirdParty = (): ReturnType<typeof checkSchema> => checkSchema({
    // Include all base validation rules
    ...clientThirdPartyBaseSchema,
    
    // Add session-based change detection at the end (consistent with other edit schemas)
    notChanged: createSessionChangeDetectionValidator(
      [
        'thirdPartyFullName',
        'thirdPartyEmailAddress', 
        'thirdPartyContactNumber',
        'thirdPartySafeToCall',
        'thirdPartyAddress',
        'thirdPartyPostcode',
        'thirdPartyRelationshipToClient',
        'thirdPartyPassphraseSetUp',
        'thirdPartyPassphrase'
      ],
      'thirdPartyOriginal',
      {
        /**
         * Returns the summary message for unchanged third party details.
         * @returns {string} Localized validation error message
         */
        summaryMessage: () => t('forms.clientDetails.thirdParty.validationError.notChanged'),
        inlineMessage: ''
      }
    ),
  });
