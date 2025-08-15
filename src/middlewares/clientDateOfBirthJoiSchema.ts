import Joi from 'joi';
import { isRecord, hasProperty, safeString } from '#src/scripts/helpers/dataTransformers.js';

/**
 * Interface for client date of birth request body
 */
interface ClientDateOfBirthBody {
  'dateOfBirth-day': string;
  'dateOfBirth-month': string;
  'dateOfBirth-year': string;
  originalDay: string;
  originalMonth: string;
  originalYear: string;
}

/**
 * Type guard to check if value has the expected structure of ClientDateOfBirthBody
 * @param {unknown} value - The value to check
 * @returns {value is ClientDateOfBirthBody} True if the value matches ClientDateOfBirthBody shape
 */
function isClientDateOfBirthBody(value: unknown): value is ClientDateOfBirthBody {
  return isRecord(value) &&
    hasProperty(value, 'dateOfBirth-day') &&
    hasProperty(value, 'dateOfBirth-month') &&
    hasProperty(value, 'dateOfBirth-year') &&
    hasProperty(value, 'originalDay') &&
    hasProperty(value, 'originalMonth') &&
    hasProperty(value, 'originalYear');
}

/**
 * Custom validation function to check if at least one of the three date fields has changed
 * @param {unknown} value - The full request body
 * @param {Joi.CustomHelpers} helpers - Joi validation helpers
 * @returns {unknown} The validated value or throws validation error
 */
const validateFieldsChanged = (value: unknown, helpers: Joi.CustomHelpers): unknown => {
  if (!isClientDateOfBirthBody(value)) {
    return value;
  }

  const currentDay = safeString(value['dateOfBirth-day']).trim();
  const currentMonth = safeString(value['dateOfBirth-month']).trim();
  const currentYear = safeString(value['dateOfBirth-year']).trim();
  
  const originalDay = safeString(value.originalDay).trim();
  const originalMonth = safeString(value.originalMonth).trim();
  const originalYear = safeString(value.originalYear).trim();

  // Check if any field has changed
  const dayChanged = currentDay !== originalDay;
  const monthChanged = currentMonth !== originalMonth;
  const yearChanged = currentYear !== originalYear;

  if (!dayChanged && !monthChanged && !yearChanged) {
    return helpers.error('fields.unchanged', {
      message: "Update the client date of birth or select 'Cancel'",
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
}).custom(validateFieldsChanged);
