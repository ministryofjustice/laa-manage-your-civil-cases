import moment from 'moment';
import {
  ZERO_PADDING_LENGTH,
  MONTH_INDEX_OFFSET,
  PRIORITY_UNKNOWN,
  SINGLE_ERROR_THRESHOLD
} from '#src/constants/dateConstants.js';
import type { ValidationError } from 'express-validator';
import type { DateFields } from '#src/types/dateTypes.js';
import { safeString } from '../scripts/helpers/dataTransformers.js';

export type { ValidationError, DateFields };

/**
 * Extract date fields from request body
 * @param {Record<string, unknown>} body - Request body containing date field values
 * @returns {DateFields} Object containing day, month, and year strings
 */
export function getDateFields(body: Record<string, unknown>): DateFields {
  const day = safeString(body['dateOfBirth-day']).trim();
  const month = safeString(body['dateOfBirth-month']).trim();
  const year = safeString(body['dateOfBirth-year']).trim();
  return { day, month, year };
}

/**
 * Check if date is real using moment
 * @param {string} day - Day value to check
 * @param {string} month - Month value to check
 * @param {string} year - Year value to check
 * @returns {boolean} True if the date is a valid calendar date
 */
export function isRealDate(day: string, month: string, year: string): boolean {
  if (day === '' || month === '' || year === '') return false;
  
  const dayNum = parseInt(day, 10);
  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(year, 10);
  
  if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) return false;
  
  const date = moment(`${yearNum}-${monthNum.toString().padStart(ZERO_PADDING_LENGTH, '0')}-${dayNum.toString().padStart(ZERO_PADDING_LENGTH, '0')}`);
  return date.isValid() && 
         date.year() === yearNum && 
         date.month() + MONTH_INDEX_OFFSET === monthNum && 
         date.date() === dayNum;
}

/**
 * Check if date is not in future
 * @param {string} day - Day value to check
 * @param {string} month - Month value to check
 * @param {string} year - Year value to check
 * @returns {boolean} True if the date is today or in the past
 */
export function isNotFutureDate(day: string, month: string, year: string): boolean {
  if (day === '' || month === '' || year === '') return false;
  
  const dayNum = parseInt(day, 10);
  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(year, 10);
  
  if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) return false;
  
  const inputDate = moment(`${yearNum}-${monthNum.toString().padStart(ZERO_PADDING_LENGTH, '0')}-${dayNum.toString().padStart(ZERO_PADDING_LENGTH, '0')}`);
  const today = moment().endOf('day');
  
  return inputDate.isSameOrBefore(today);
}

/**
 * Check if current date values match original values
 * @param {Record<string, unknown>} body - Request body containing current and original date values
 * @returns {boolean} True if current date matches original date
 */
export function isUnchangedDate(body: Record<string, unknown>): boolean {
  const day = safeString(body['dateOfBirth-day']).trim();
  const month = safeString(body['dateOfBirth-month']).trim();
  const year = safeString(body['dateOfBirth-year']).trim();
  const originalDay = safeString(body.originalDay).trim();
  const originalMonth = safeString(body.originalMonth).trim();
  const originalYear = safeString(body.originalYear).trim();
  return day === originalDay && month === originalMonth && year === originalYear;
}

/**
 * Filter validation errors to show only the highest priority ones.
 * 
 * When multiple validation errors exist, this function filters them to show
 * only the errors with the highest priority (lowest numeric value) to avoid
 * overwhelming the user with too many error messages.
 * 
 * @param {ValidationError[]} errors Array of validation errors from express-validator
 * @param {Record<string, number>} errorPriorityMap Map of error messages to priority numbers (lower = higher priority)
 * @returns {ValidationError[]} Filtered array containing only highest priority errors
 */
export function filterErrorsByPriority(
  errors: ValidationError[],
  errorPriorityMap: Record<string, number>
): ValidationError[] {
  if (errors.length <= SINGLE_ERROR_THRESHOLD) {
    return errors;
  }
  
  // Find the highest priority (lowest number) among all errors
  const highestPriority = Math.min(
    ...errors.map(error => {
      // Use discriminated union type checking as per express-validator docs
      switch (error.type) {
        case 'field': {
          // error is a FieldValidationError, but msg is still 'any'
          const msg = String(error.msg);
          return errorPriorityMap[msg] ?? PRIORITY_UNKNOWN;
        }
        default: {
          // Handle other error types
          const msg = String(error.msg);
          return errorPriorityMap[msg] ?? PRIORITY_UNKNOWN;
        }
      }
    })
  );
  
  // Return all errors that have the highest priority
  const filtered = errors.filter(error => {
    switch (error.type) {
      case 'field': {
        // error is a FieldValidationError, but msg is still 'any'
        const msg = String(error.msg);
        return (errorPriorityMap[msg] ?? PRIORITY_UNKNOWN) === highestPriority;
      }
      default: {
        // Handle other error types
        const msg = String(error.msg);
        return (errorPriorityMap[msg] ?? PRIORITY_UNKNOWN) === highestPriority;
      }
    }
  });
  
  return filtered;
}
