import { checkSchema } from 'express-validator';
import { TypedValidationError, t } from '#src/scripts/helpers/index.js';
import config from '#config.js';

const { MAX_PROVIDER_NOTE_LENGTH }: { MAX_PROVIDER_NOTE_LENGTH: number } = config;

/**
 * Validation schema for provider notes.
 * Requires a mandatory note with maximum length validation.
 */
const providerNoteSchema = {
  providerNote: {
    trim: true,
    notEmpty: {
      /**
       * Custom error message for empty provider note
       * @returns {TypedValidationError} Returns TypedValidationError with structured error data
       */
      errorMessage: () => new TypedValidationError({
        summaryMessage: t('forms.caseDetails.providerNote.validationError.notEmpty'),
        inlineMessage: t('forms.caseDetails.providerNote.validationError.notEmpty')
      })
    },
    isLength: {
      options: { max: MAX_PROVIDER_NOTE_LENGTH },
      /**
       * Custom error message for note exceeding max length
       * @returns {TypedValidationError} Returns TypedValidationError with structured error data
       */
      errorMessage: () => new TypedValidationError({
        summaryMessage: t('forms.caseDetails.providerNote.validationError.tooLong'),
        inlineMessage: t('forms.caseDetails.providerNote.validationError.tooLong')
      })
    }
  }
};

/**
 * Validation middleware for provider note form.
 * @returns {Error} Validation schema for express-validator
 */
export const validateProviderNote = (): ReturnType<typeof checkSchema> =>
  checkSchema(providerNoteSchema);
