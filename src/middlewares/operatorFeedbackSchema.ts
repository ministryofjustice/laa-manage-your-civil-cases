import { checkSchema } from 'express-validator';
import { TypedValidationError, t } from '#src/scripts/helpers/index.js';
import config from '#config.js';

const { MAX_OPERATOR_FEEDBACK_COMMENT_LENGTH } = config;

/**
 * Validation schema for operator feedback.
 * Requires a feedback category and comment.
 */
const operatorFeedbackSchema = {
  category: {
    trim: true,
    notEmpty: {
      /**
       * Custom error message for empty category
       * @returns {TypedValidationError} Returns TypedValidationError with structured error data
       */
      errorMessage: () => new TypedValidationError({
        summaryMessage: t('forms.caseDetails.operatorFeedback.validationError.category.notEmpty'),
        inlineMessage: t('forms.caseDetails.operatorFeedback.validationError.category.notEmpty')
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
        summaryMessage: t('forms.caseDetails.operatorFeedback.validationError.comment.notEmpty'),
        inlineMessage: t('forms.caseDetails.operatorFeedback.validationError.comment.notEmpty')
      })
    },
    isLength: {
      options: { max: MAX_OPERATOR_FEEDBACK_COMMENT_LENGTH },
      /**
       * Custom error message for comment exceeding max length
       * @returns {TypedValidationError} Returns TypedValidationError with structured error data
       */
      errorMessage: () => new TypedValidationError({
        summaryMessage: t('forms.caseDetails.operatorFeedback.validationError.comment.tooLong'),
        inlineMessage: t('forms.caseDetails.operatorFeedback.validationError.comment.tooLong')
      })
    }
  }
};

/**
 * Validation middleware for operator feedback form.
 * @returns {Error} Validation schema for express-validator
 */
export const validateOperatorFeedback = (): ReturnType<typeof checkSchema> =>
  checkSchema(operatorFeedbackSchema);
