import { checkSchema } from 'express-validator';
import { TypedValidationError, t } from '#src/scripts/helpers/index.js';
import config from '#config.js';

const { MAX_NOTE_LENGTH }: { MAX_NOTE_LENGTH: number } = config;
export const MAX_CLOSE_NOTE_LENGTH = MAX_NOTE_LENGTH;

/**
 * Base schema object for close case validation.
 * Contains all validation rules for close case form fields.
 */
const closeCaseBaseSchema = {
  eventCode: {
    trim: true,
    notEmpty: {
      /**
       * Error message for eventCode validation
       * @returns {TypedValidationError} Returns TypedValidationError with structured error data
       */
      errorMessage: () => new TypedValidationError({
        summaryMessage: t('forms.caseDetails.closeCase.validationError.eventCode.notEmpty'),
        inlineMessage: t('forms.caseDetails.closeCase.validationError.eventCode.notEmpty')
      })
    }
  },
  closeNote: {
    optional: { options: { values: 'falsy' } as const },
    trim: true,
    isLength: {
      options: { max: MAX_NOTE_LENGTH },
      /**
       * Error message for closeNote length validation
       * @returns {TypedValidationError} Returns TypedValidationError with structured error data
       */
      errorMessage: () => new TypedValidationError({
        summaryMessage: t('forms.caseDetails.closeCase.validationError.closeNote.tooLong'),
        inlineMessage: t('forms.caseDetails.closeCase.validationError.closeNote.tooLong')
      })
    }
  }
};

/**
 * Validation middleware for closing a case.
 * @returns {Error} Validation schema for express-validator
 */
export const validateCloseCase = (): ReturnType<typeof checkSchema> =>
  checkSchema(closeCaseBaseSchema);
