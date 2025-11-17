import { checkSchema } from 'express-validator';
import type { Meta } from 'express-validator';
import { TypedValidationError, t, createSessionChangeDetectionValidator, normaliseSelectedCheckbox, safeBodyString } from '#src/scripts/helpers/index.js';

/**
 * Base schema object for client support needs validation.
 * Contains all validation rules for client support needs form fields.
 */
const clientSupportNeedsBaseSchema = {
  clientSupportNeeds: {
    notEmpty: {
      /**
       * Custom error message for empty client supports needs checkbox
       * @returns {TypedValidationError} Returns TypedValidationError with structured error data
       */
      errorMessage: () => new TypedValidationError({
        summaryMessage: t('forms.clientDetails.clientSupportNeeds.validationError.notEmpty'),
        inlineMessage: t('forms.clientDetails.clientSupportNeeds.validationError.notEmpty')
      })
    },
  },
  languageSupportNeeds: {
    trim: true,
    custom: {
      /**
       * This checks that the `languageSelection` checkbox is selected
       * @param {string} value - the value of the input field
       * @param {object} meta - metadata object containing request information
       * @param {object} meta.req - Express request object
       * @returns {boolean} Returns a decision as to whether we should apply validation
       */
      options: (value: string, meta: Meta) => {
        const pickedCheckboxes = normaliseSelectedCheckbox(safeBodyString(meta.req.body, 'clientSupportNeeds'));
        const languageSelection = pickedCheckboxes.includes("languageSelection");
        const EMPTY = 0;

        if (!languageSelection) return true;
        return typeof value === "string" && value.trim().length > EMPTY;
      },
    },
    /**
     * Custom error message for passphrase
     * @returns {TypedValidationError} Returns TypedValidationError with structured error data
     */
    errorMessage: () => new TypedValidationError({
      summaryMessage: t('forms.clientDetails.clientSupportNeeds.validationError.notEmptyLanguage'),
      inlineMessage: t('forms.clientDetails.clientSupportNeeds.validationError.notEmptyLanguage')
    }),
  },
  notes: {
    trim: true,
    custom: {
      /**
       * This checks that the `otherSupport` checkbox is selected
       * @param {string} value - the value of the input field
       * @param {object} meta - metadata object containing request information
       * @param {object} meta.req - Express request object
       * @returns {boolean} Returns a decision as to whether we should apply validation
       */
      options: (value: string, meta: Meta) => {
        const pickedCheckboxes = normaliseSelectedCheckbox(safeBodyString(meta.req.body, 'clientSupportNeeds'));
        const otherSupport = pickedCheckboxes.includes("otherSupport");
        const EMPTY = 0;
        const MAX_LENGTH = 250;

        if (!otherSupport) return true;
        return typeof value === "string" && value.trim().length > EMPTY && value.trim().length <= MAX_LENGTH;
      },
    },
    /**
     * Custom error message for passphrase
     * @param {string} value - the value of the input field
     * @returns {TypedValidationError} Returns TypedValidationError with structured error data
     */
    errorMessage: (value: string) => {
    const MAX_LENGTH = 250;

    // Too long
    if (typeof value === "string" && value.trim().length > MAX_LENGTH) {
      return new TypedValidationError({
        summaryMessage: t('forms.clientDetails.clientSupportNeeds.validationError.tooLongNotes'),
        inlineMessage: t('forms.clientDetails.clientSupportNeeds.validationError.tooLongNotes')
      });
    }

    // Empty
    return new TypedValidationError({
      summaryMessage: t('forms.clientDetails.clientSupportNeeds.validationError.notEmptyNotes'),
      inlineMessage: t('forms.clientDetails.clientSupportNeeds.validationError.notEmptyNotes')
    });
  },
  },
};

/**
 * Validation middleware when user adds client support needs form.
 * @returns {Error} Validation schema for express-validator
 */
export const validateAddClientSupportNeeds = (): ReturnType<typeof checkSchema> =>
  checkSchema(clientSupportNeedsBaseSchema);

/**
 * Validation middleware when user edits client support needs form.
 * Extends the add validation with session-based change detection to ensure modifications have been made.
 * @returns {Error} Validation schema for express-validator
 */
export const validateEditClientSupportNeeds = (): ReturnType<typeof checkSchema> => checkSchema({
    // Include all base validation rules
    ...clientSupportNeedsBaseSchema,
    // Add session-based change detection at the end (consistent with other edit schemas)
    notChanged: createSessionChangeDetectionValidator(
      [
        'clientSupportNeeds',
        'languageSupportNeeds', 
        'notes'
      ],
      'clientSupportNeedsOriginal',
      {
        /**
         * Returns the summary message for unchanged third party details.
         * @returns {string} Localized validation error message
         */
        summaryMessage: () => t('forms.clientDetails.clientSupportNeeds.validationError.notChanged'),
        inlineMessage: ''
      }
    ),
  });