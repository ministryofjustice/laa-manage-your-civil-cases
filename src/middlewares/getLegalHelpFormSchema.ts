import { checkSchema } from 'express-validator';
import { TypedValidationError, t, normaliseSelectedCheckbox, LEGAL_HELP_FORM_CIRCUMSTANCE_VALUES } from '#src/scripts/helpers/index.js';
import config from '#config.js';

const { MAX_LEGAL_HELP_FORM_EVIDENCE_LENGTH }: { MAX_LEGAL_HELP_FORM_EVIDENCE_LENGTH: number } = config;

/**
 * Validation schema for the get legal help form interstitial page.
 * All fields are optional; the evidence field just has a maximum length and
 * additionalCircumstances is restricted to the known checkbox values.
 */
const getLegalHelpFormSchema = {
  evidence: {
    trim: true,
    optional: { options: { checkFalsy: true } },
    isLength: {
      options: { max: MAX_LEGAL_HELP_FORM_EVIDENCE_LENGTH },
      /**
       * Custom error message for evidence exceeding max length
       * @returns {TypedValidationError} Returns TypedValidationError with structured error data
       */
      errorMessage: () => new TypedValidationError({
        summaryMessage: t('forms.caseDetails.getLegalHelpForm.validationError.evidence.tooLong'),
        inlineMessage: t('forms.caseDetails.getLegalHelpForm.validationError.evidence.tooLong')
      })
    }
  },
  additionalCircumstances: {
    custom: {
      /**
       * Ensures every selected checkbox value is one of the known circumstance options
       * @param {unknown} value - the raw additionalCircumstances field from the request body
       * @returns {boolean} True if every selected value is recognised
       */
      options: (value: unknown) => normaliseSelectedCheckbox(value).every((selected) => LEGAL_HELP_FORM_CIRCUMSTANCE_VALUES.includes(selected))
    },
    /**
     * Custom error message for an unrecognised additionalCircumstances value
     * @returns {TypedValidationError} Returns TypedValidationError with structured error data
     */
    errorMessage: () => new TypedValidationError({
      summaryMessage: t('forms.caseDetails.getLegalHelpForm.validationError.additionalCircumstances.invalid'),
      inlineMessage: t('forms.caseDetails.getLegalHelpForm.validationError.additionalCircumstances.invalid')
    })
  }
};

/**
 * Validation middleware for the get legal help form interstitial page.
 * @returns {Error} Validation schema for express-validator
 */
export const validateGetLegalHelpForm = (): ReturnType<typeof checkSchema> =>
  checkSchema(getLegalHelpFormSchema);
