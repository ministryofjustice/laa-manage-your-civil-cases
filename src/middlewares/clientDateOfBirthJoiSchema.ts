import Joi from 'joi';
import { createValidator } from 'express-joi-validation';
import { safeString } from '#src/scripts/helpers/dataTransformers.js';

/**
 * Custom validation function to check if at least one of the three date fields has changed
 * @param {unknown} value - The full request body
 * @param {Joi.CustomHelpers} helpers - Joi validation helpers
 * @returns {unknown} The validated value or throws validation error
 */
const validateFieldsChanged = (value: unknown, helpers: Joi.CustomHelpers): unknown => {
  const currentDay = safeString((value as any)?.['dateOfBirth-day']).trim();
  const currentMonth = safeString((value as any)?.['dateOfBirth-month']).trim();
  const currentYear = safeString((value as any)?.['dateOfBirth-year']).trim();
  
  const originalDay = safeString((value as any)?.originalDay).trim();
  const originalMonth = safeString((value as any)?.originalMonth).trim();
  const originalYear = safeString((value as any)?.originalYear).trim();

  // Check if any field has changed
  const dayChanged = currentDay !== originalDay;
  const monthChanged = currentMonth !== originalMonth;
  const yearChanged = currentYear !== originalYear;

  if (!dayChanged && !monthChanged && !yearChanged) {
    return helpers.error('any.custom', {
      custom: "Update the client date of birth or select 'Cancel'",
      priority: 1
    });
  }

  return value;
};

/**
 * Joi schema for date of birth change detection - proof of concept
 * Only validates that at least one of the three fields has changed
 */
export const dateOfBirthChangeSchema = Joi.object({
  'dateOfBirth-day': Joi.string().allow(''),
  'dateOfBirth-month': Joi.string().allow(''),
  'dateOfBirth-year': Joi.string().allow(''),
  originalDay: Joi.string().allow('').default(''),
  originalMonth: Joi.string().allow('').default(''),
  originalYear: Joi.string().allow('').default(''),
}).custom(validateFieldsChanged).messages({
  'any.custom': '{{#custom}}'
});

/**
 * Create the joi validator instance
 */
const validator = createValidator({
  passError: true,
  joi: {
    allowUnknown: false,
    stripUnknown: true,
    abortEarly: false
  }
});

/**
 * Joi middleware function for validating client date of birth changes
 * @returns Express middleware function
 */
export const validateEditClientDateOfBirthJoi = () => {
  return validator.body(dateOfBirthChangeSchema);
};
