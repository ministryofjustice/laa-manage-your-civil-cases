import { checkSchema } from 'express-validator';
import type { Meta } from 'express-validator';
import { createChangeDetectionValidator, TypedValidationError, t } from '#src/scripts/helpers/index.js';

/**
 * Validation middleware when user edits client's risk of abuse.
 * @returns {Error} Validation schema for express-validator
 */
export const validateClientRiskOfAbuse = (): ReturnType<typeof checkSchema> =>
  checkSchema({
    clientRiskOfAbuse: {
      trim: true,
      notEmpty: {
        /**
         * Custom error message for empty selection of client's risk of abuse
         * @returns {TypedValidationError} Returns TypedValidationError with structured error data
         */
        errorMessage: () => new TypedValidationError({
          summaryMessage: t('forms.clientDetails.riskOfAbuse.validationError.notEmpty'),
          inlineMessage: t('forms.clientDetails.riskOfAbuse.validationError.notEmpty')
        })
      },
    },
    existingRiskOfAbuse: {
      trim: true,
      notEmpty: {
        /**
         * Custom error message for empty exising risk of abuse field.
         * @returns {TypedValidationError} Returns TypedValidationError with structured error data
         */
        errorMessage: () => new TypedValidationError({
          summaryMessage: t('forms.clientDetails.riskOfAbuse.validationError.notEmpty'),
          inlineMessage: t('forms.clientDetails.riskOfAbuse.validationError.notEmpty')
        })
      },
    }
  });