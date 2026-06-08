import { checkSchema } from 'express-validator';
import { TypedValidationError, t } from '#src/scripts/helpers/index.js';
import config from '#config.js';

const { MAX_OPERATOR_FEEDBACK_COMMENT_LENGTH } = config;

/**
 * Validation schema for "change category of law" form.
 * @returns {Error} Validation schema for express-validator
 */
const changeCategoryOfLawSchema = {
  category: {
    trim: true,
    notEmpty: {
      /**
       * Custom error message for no drop down selection
       * @returns {TypedValidationError} Returns TypedValidationError with structured error data
       */
      errorMessage: () => new TypedValidationError({
        summaryMessage: t('forms.caseDetails.changeCategoryOfLaw.validationError.category.notEmpty'),
        inlineMessage: t('forms.caseDetails.changeCategoryOfLaw.validationError.category.notEmpty')
      })
    }
  },
  notes: {
    trim: true,
    notEmpty: {
      /**
       * Custom error message for empty comment
       * @returns {TypedValidationError} Returns TypedValidationError with structured error data
       */
      errorMessage: () => new TypedValidationError({
        summaryMessage: t('forms.caseDetails.changeCategoryOfLaw.validationError.notes.notEmpty'),
        inlineMessage: t('forms.caseDetails.changeCategoryOfLaw.validationError.notes.notEmpty')
      })
    },
    isLength: {
      options: { max: MAX_OPERATOR_FEEDBACK_COMMENT_LENGTH },
      /**
       * Custom error message for comment exceeding max length
       * @returns {TypedValidationError} Returns TypedValidationError with structured error data
       */
      errorMessage: () => new TypedValidationError({
        summaryMessage: t('forms.caseDetails.changeCategoryOfLaw.validationError.notes.tooLong'),
        inlineMessage: t('forms.caseDetails.changeCategoryOfLaw.validationError.notes.tooLong')
      })
    }
  }
};

/**
 * Validation middleware for "change category of law" form.
 * @returns {Error} Validation schema for express-validator
 */
export const validateChangeCategoryOfLaw = (): ReturnType<typeof checkSchema> =>
  checkSchema(changeCategoryOfLawSchema);
