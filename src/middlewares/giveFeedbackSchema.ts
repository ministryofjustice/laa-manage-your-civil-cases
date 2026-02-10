import { checkSchema } from 'express-validator';
import { TypedValidationError, t } from '#src/scripts/helpers/index.js';

/**
 * Validation schema for give feedback.
 */
const giveFeedbackSchema = {
  doYouWantToGiveFeedback: {
    trim: true,
    notEmpty: {
      /**
       * Custom error message for empty radio selection
       * @returns {TypedValidationError} Returns TypedValidationError with structured error data
       */
      errorMessage: () => new TypedValidationError({
        summaryMessage: t('forms.caseDetails.doYouWantToGiveFeedback.validationError.doYouWantToGiveFeedback.notEmpty'),
        inlineMessage: t('forms.caseDetails.doYouWantToGiveFeedback.validationError.doYouWantToGiveFeedback.notEmpty')
      })
    }
  }
};

/**
 * Validation middleware for "do you want to give feedback" form.
 * @returns {Error} Validation schema for express-validator
 */
export const validateGiveFeedback = (): ReturnType<typeof checkSchema> =>
  checkSchema(giveFeedbackSchema);
