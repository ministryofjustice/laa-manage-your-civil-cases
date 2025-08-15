import Joi from 'joi';

/**
 * Custom validation function to check if at least one of the three date fields has changed
 * @param {any} value - The full request body
 * @param {Joi.CustomHelpers} helpers - Joi validation helpers
 * @returns {any} The validated value or throws validation error
 */
const validateFieldsChanged = (value: any, helpers: Joi.CustomHelpers) => {
  const currentDay = value['dateOfBirth-day']?.trim() || '';
  const currentMonth = value['dateOfBirth-month']?.trim() || '';
  const currentYear = value['dateOfBirth-year']?.trim() || '';
  
  const originalDay = value.originalDay?.trim() || '';
  const originalMonth = value.originalMonth?.trim() || '';
  const originalYear = value.originalYear?.trim() || '';

  // Check if any field has changed
  const dayChanged = currentDay !== originalDay;
  const monthChanged = currentMonth !== originalMonth;
  const yearChanged = currentYear !== originalYear;

  if (!dayChanged && !monthChanged && !yearChanged) {
    return helpers.error('fields.unchanged', {
      message: "Update the client date of birth or select 'Cancel'"
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
}).custom(validateFieldsChanged);
