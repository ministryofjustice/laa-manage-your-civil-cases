import { checkSchema } from 'express-validator';
import { TypedValidationError, t } from '#src/scripts/helpers/index.js';

// Constants
const MAX_REOPEN_NOTE_LENGTH = 5000;

/**
 * Validation schema for reopening a case.
 * Requires a mandatory note explaining why the case is being reopened.
 */
const adviseCaseSchema = {
  adviseNote: {
    trim: true,
    notEmpty: {
      /**
       * Custom error message for empty reopen note
       * @returns {TypedValidationError} Returns TypedValidationError with structured error data
       */
      errorMessage: () => new TypedValidationError({
        summaryMessage: t('forms.caseDetails.reopenCase.validationError.notEmpty'),
        inlineMessage: t('forms.caseDetails.reopenCase.validationError.notEmpty')
      })
    },
    isLength: {
      options: { max: MAX_REOPEN_NOTE_LENGTH },
      /**
       * Custom error message for note exceeding max length
       * @returns {TypedValidationError} Returns TypedValidationError with structured error data
       */
      errorMessage: () => new TypedValidationError({
        summaryMessage: t('forms.caseDetails.reopenCase.validationError.tooLong'),
        inlineMessage: t('forms.caseDetails.reopenCase.validationError.tooLong')
      })
    }
  }
};

/**
 * Validation middleware for advise case form.
 * @returns {Error} Validation schema for express-validator
 */
export const validateAdviseCase = (): ReturnType<typeof checkSchema> =>
  checkSchema(adviseCaseSchema);
