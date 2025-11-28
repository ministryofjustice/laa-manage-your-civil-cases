import { checkSchema } from 'express-validator';
import type { Meta } from 'express-validator';
import { TypedValidationError, t, safeBodyString } from '#src/scripts/helpers/index.js';
import config from '#config.js';

const { MAX_NOTE_LENGTH }: { MAX_NOTE_LENGTH: number } = config;
export const MAX_PENDING_NOTE_LENGTH = MAX_NOTE_LENGTH;

/**
 * Base schema object for pending case validation.
 * Contains all validation rules for pending case form fields.
 */
const pendingCaseBaseSchema = {
  pendingReason: {
    trim: true,
    notEmpty: {
      /**
       * Error message for pendingReason validation
       * @returns {TypedValidationError} Returns TypedValidationError with structured error data
       */
      errorMessage: () => new TypedValidationError({
        summaryMessage: t('forms.caseDetails.pendingCase.validationError.pendingReason.notEmpty'),
        inlineMessage: t('forms.caseDetails.pendingCase.validationError.pendingReason.notEmpty')
      })
    }
  },
  otherNote: {
    trim: true,
    custom: {
      /**
       * This checks that the 'other' radio option is selected
       * @param {string} value - the value of the input field
       * @param {object} meta - metadata object containing request information
       * @param {object} meta.req - Express request object
       * @returns {boolean} Returns a decision as to whether we should apply validation
       */
      options: (value: string, meta: Meta) => {
        const pendingReason = safeBodyString(meta.req.body, 'pendingReason');
        const EMPTY = 0;

        if (pendingReason !== 'other') return true;
        return typeof value === 'string' && value.trim().length > EMPTY && value.trim().length <= MAX_NOTE_LENGTH;
      }
    },
    /**
     * Custom error message for otherNote
     * @param {string} value - the value of the input field
     * @returns {TypedValidationError} Returns TypedValidationError with structured error data
     */
    errorMessage: (value: string) => {
      const MAX_LENGTH = MAX_NOTE_LENGTH;

      // Too long
      if (typeof value === 'string' && value.trim().length > MAX_LENGTH) {
        return new TypedValidationError({
          summaryMessage: t('forms.caseDetails.pendingCase.validationError.otherNote.tooLong'),
          inlineMessage: t('forms.caseDetails.pendingCase.validationError.otherNote.tooLong')
        });
      }

      // Empty
      return new TypedValidationError({
        summaryMessage: t('forms.caseDetails.pendingCase.validationError.otherNote.notEmpty'),
        inlineMessage: t('forms.caseDetails.pendingCase.validationError.otherNote.notEmpty')
      });
    }
  }
};

/**
 * Validation middleware for pending case form.
 * @returns {Error} Validation schema for express-validator
 */
export const validatePendingCase = (): ReturnType<typeof checkSchema> =>
  checkSchema(pendingCaseBaseSchema);
