import { checkSchema } from 'express-validator';
import { TypedValidationError, t } from '#src/scripts/helpers/index.js';

/**
 * Validation schema for splitting a case.
 */
const splitThisCaseSchema = {
  internal: {
    trim: true,
    notEmpty: {
      /**
       * Custom error message for empty radio selection
       * @returns {TypedValidationError} Returns TypedValidationError with structured error data
       */
      errorMessage: () => new TypedValidationError({
        summaryMessage: t('forms.caseDetails.splitCase.validationError.splitCase.notEmpty'),
        inlineMessage: t('forms.caseDetails.splitCase.validationError.splitCase.notEmpty')
      })
    }
  }
};

/**
 * Validation middleware for "do you want to give feedback" form.
 * @returns {Error} Validation schema for express-validator
 */
export const validateSplitThisCase = (): ReturnType<typeof checkSchema> =>
  checkSchema(splitThisCaseSchema);
