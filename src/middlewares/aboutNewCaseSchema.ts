import { checkSchema } from 'express-validator';
import { TypedValidationError, t } from '#src/scripts/helpers/index.js';
import config from '#config.js';

const { MAX_OPERATOR_FEEDBACK_COMMENT_LENGTH } = config;

/**
 * Validation schema for "about new case" form.
 */
const aboutNewCaseSchema = {
  category: {
    trim: true,
    notEmpty: {
      /**
       * Custom error message for empty radio selection
       * @returns {TypedValidationError} Returns TypedValidationError with structured error data
       */
      errorMessage: () => new TypedValidationError({
        summaryMessage: t('forms.caseDetails.aboutNewCase.validationError.category.notEmpty'),
        inlineMessage: t('forms.caseDetails.aboutNewCase.validationError.category.notEmpty')
      })
    }
  },
  comment: {
    trim: true,
    notEmpty: {
      /**
       * Custom error message for empty comment
       * @returns {TypedValidationError} Returns TypedValidationError with structured error data
       */
      errorMessage: () => new TypedValidationError({
        summaryMessage: t('forms.caseDetails.aboutNewCase.validationError.comment.notEmpty'),
        inlineMessage: t('forms.caseDetails.aboutNewCase.validationError.comment.notEmpty')
      })
    },
    isLength: {
      options: { max: MAX_OPERATOR_FEEDBACK_COMMENT_LENGTH },
      /**
       * Custom error message for comment exceeding max length
       * @returns {TypedValidationError} Returns TypedValidationError with structured error data
       */
      errorMessage: () => new TypedValidationError({
        summaryMessage: t('forms.caseDetails.aboutNewCase.validationError.comment.tooLong'),
        inlineMessage: t('forms.caseDetails.aboutNewCase.validationError.comment.tooLong')
      })
    }
  }
};

/**
 * Validation middleware for "about new case" form.
 * @returns {Error} Validation schema for express-validator
 */
export const validateAboutNewCase = (): ReturnType<typeof checkSchema> =>
  checkSchema(aboutNewCaseSchema);
