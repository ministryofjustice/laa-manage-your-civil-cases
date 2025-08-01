import { body, type ValidationChain } from 'express-validator';
import moment from 'moment';
import {
  MIN_DAY,
  MAX_DAY,
  MIN_MONTH,
  MAX_MONTH,
  ZERO_PADDING_LENGTH,
  MONTH_INDEX_OFFSET,
  PRIORITY_MISSING_ALL,
  PRIORITY_MISSING_FIELDS,
  PRIORITY_FORMAT_DAY,
  PRIORITY_FORMAT_MONTH,
  PRIORITY_FORMAT_YEAR,
  PRIORITY_REAL_DATE,
  PRIORITY_FUTURE_DATE,
  PRIORITY_UNCHANGED,
  PRIORITY_UNKNOWN,
  SINGLE_ERROR_THRESHOLD,
  ZERO_ERRORS
} from '#src/constants/dateConstants.js';

/**
 * Simple date validation with priority-based error filtering
 */

// Error priority constants (lower = higher priority)
const PRIORITY = {
  MISSING_ALL: PRIORITY_MISSING_ALL,
  MISSING_FIELDS: PRIORITY_MISSING_FIELDS,  // Same priority for all individual missing field errors
  FORMAT_DAY: PRIORITY_FORMAT_DAY,
  FORMAT_MONTH: PRIORITY_FORMAT_MONTH,
  FORMAT_YEAR: PRIORITY_FORMAT_YEAR,
  REAL_DATE: PRIORITY_REAL_DATE,
  FUTURE_DATE: PRIORITY_FUTURE_DATE,
  UNCHANGED: PRIORITY_UNCHANGED,
  UNKNOWN: PRIORITY_UNKNOWN
} as const;

interface ValidationError {
  msg: string;
  path?: string;
  value?: unknown;
  location?: string;
}

/**
 * Safely convert unknown value to string
 * @param {unknown} value - Value to convert
 * @returns {string} String representation
 */
function safeToString(value: unknown): string {
  return typeof value === 'string' ? value : (value?.toString() ?? '');
}

/**
 * Extract date fields from request
 * @param {object} req - Express request object with body containing form data
 * @param {Record<string, unknown>} req.body - Request body containing date field values
 * @returns {object} Object containing day, month, and year strings
 */
function getDateFields(req: { body?: Record<string, unknown> }): { day: string; month: string; year: string } {
  const {body} = req;
  
  const day = safeToString(body?.['dateOfBirth-day']).trim();
  const month = safeToString(body?.['dateOfBirth-month']).trim();
  const year = safeToString(body?.['dateOfBirth-year']).trim();
  
  return { day, month, year };
}

/**
 * Check if date is real using moment
 * @param {string} day - Day component as string
 * @param {string} month - Month component as string  
 * @param {string} year - Year component as string
 * @returns {boolean} True if the date is valid, false otherwise
 */
function isRealDate(day: string, month: string, year: string): boolean {
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
 * @param {string} day - Day component as string
 * @param {string} month - Month component as string  
 * @param {string} year - Year component as string
 * @returns {boolean} True if the date is not in the future, false otherwise
 */
function isNotFutureDate(day: string, month: string, year: string): boolean {
  if (day === '' || month === '' || year === '') return false;
  
  const dayNum = parseInt(day, 10);
  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(year, 10);
  
  if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) return false;
  
  const inputDate = moment(`${yearNum}-${monthNum.toString().padStart(ZERO_PADDING_LENGTH, '0')}-${dayNum.toString().padStart(ZERO_PADDING_LENGTH, '0')}`);
  const today = moment().endOf('day');
  
  return inputDate.isSameOrBefore(today);
}

// Simple validation chains - one per error type

export const validateMissingDay: ValidationChain = body('dateOfBirth-day')
  .custom((value, { req }) => {
    const { day, month, year } = getDateFields(req);
    if (day === '' && (month !== '' || year !== '')) {
      throw new Error('Date of birth must include a day');
    }
    return true;
  });

export const validateMissingMonth: ValidationChain = body('dateOfBirth-month')
  .custom((value, { req }) => {
    const { day, month, year } = getDateFields(req);
    if (month === '' && (day !== '' || year !== '')) {
      throw new Error('Date of birth must include a month');
    }
    return true;
  });

export const validateMissingYear: ValidationChain = body('dateOfBirth-year')
  .custom((value, { req }) => {
    const { day, month, year } = getDateFields(req);
    if (year === '' && (day !== '' || month !== '')) {
      throw new Error('Date of birth must include a year');
    }
    return true;
  });

export const validateAllMissing: ValidationChain = body('dateOfBirth-day')
  .custom((value, { req }) => {
    const { day, month, year } = getDateFields(req);
    if (day === '' && month === '' && year === '') {
      throw new Error('Enter the date of birth');
    }
    return true;
  });

export const validateDayFormat: ValidationChain = body('dateOfBirth-day')
  .custom((value, { req }) => {
    const { day } = getDateFields(req);
    if (day !== '') {
      const dayNum = parseInt(day, 10);
      if (isNaN(dayNum) || dayNum < MIN_DAY || dayNum > MAX_DAY) {
        throw new Error('Day must be a number between 1 and 31');
      }
    }
    return true;
  });

export const validateMonthFormat: ValidationChain = body('dateOfBirth-month')
  .custom((value, { req }) => {
    const { month } = getDateFields(req);
    if (month !== '') {
      const monthNum = parseInt(month, 10);
      if (isNaN(monthNum) || monthNum < MIN_MONTH || monthNum > MAX_MONTH) {
        throw new Error('Month must be a number between 1 and 12');
      }
    }
    return true;
  });

export const validateYearFormat: ValidationChain = body('dateOfBirth-year')
  .custom((value, { req }) => {
    const { year } = getDateFields(req);
    if (year !== '') {
      if (!/^\d{4}$/.test(year) || year.startsWith('0')) {
        throw new Error('Year must be a 4-digit number');
      }
    }
    return true;
  });

export const validateRealDate: ValidationChain = body('dateOfBirth-day')
  .custom((value, { req }) => {
    const { day, month, year } = getDateFields(req);
    if (day !== '' && month !== '' && year !== '') {
      if (!isRealDate(day, month, year)) {
        throw new Error('Date of birth must be a real date');
      }
    }
    return true;
  });

export const validateNotFuture: ValidationChain = body('dateOfBirth-day')
  .custom((value, { req }) => {
    const { day, month, year } = getDateFields(req);
    if (day !== '' && month !== '' && year !== '') {
      if (!isNotFutureDate(day, month, year)) {
        throw new Error('Date of birth must be today or in the past');
      }
    }
    return true;
  });

/**
 * Extract original date fields from request for comparison
 * @param {object} req - Express request object
 * @param {Record<string, unknown>} req.body - Request body containing original date field values
 * @returns {object} Object containing original day, month, and year strings
 */
function getOriginalDateFields(req: { body?: Record<string, unknown> }): { originalDay: string; originalMonth: string; originalYear: string } {
  const { body } = req;
  
  const originalDay = safeToString(body?.originalDay).trim();
  const originalMonth = safeToString(body?.originalMonth).trim();
  const originalYear = safeToString(body?.originalYear).trim();
  
  return { originalDay, originalMonth, originalYear };
}

/**
 * Check if current date values match original values
 * @param {object} current - Current date values
 * @param {string} current.day - Current day value
 * @param {string} current.month - Current month value
 * @param {string} current.year - Current year value
 * @param {object} original - Original date values
 * @param {string} original.originalDay - Original day value
 * @param {string} original.originalMonth - Original month value
 * @param {string} original.originalYear - Original year value
 * @returns {boolean} True if all values match, false otherwise
 */
function isUnchangedDate(
  current: { day: string; month: string; year: string }, 
  original: { originalDay: string; originalMonth: string; originalYear: string }
): boolean {
  return current.day === original.originalDay && 
         current.month === original.originalMonth && 
         current.year === original.originalYear;
}

export const validateUnchanged: ValidationChain = body('dateOfBirth-day')
  .custom((value, { req }) => {
    const { day, month, year } = getDateFields(req);
    const { originalDay, originalMonth, originalYear } = getOriginalDateFields(req);
    
    // Only check if all fields are provided and not empty
    if (day !== '' && month !== '' && year !== '' && 
        originalDay !== '' && originalMonth !== '' && originalYear !== '') {
      if (isUnchangedDate({ day, month, year }, { originalDay, originalMonth, originalYear })) {
        throw new Error('Enter the date of birth, or select \'Cancel\'');
      }
    }
    return true;
  });

// All validators in order of priority
export const dateOfBirthValidation = [
  validateAllMissing,
  validateMissingDay,
  validateMissingMonth,
  validateMissingYear,
  validateDayFormat,
  validateMonthFormat,
  validateYearFormat,
  validateRealDate,
  validateNotFuture,
  validateUnchanged
];

/**
 * Error priority mapping
 */
const ERROR_PRIORITY: Record<string, number> = {
  'Enter the date of birth': PRIORITY.MISSING_ALL,
  'Date of birth must include a day': PRIORITY.MISSING_FIELDS,
  'Date of birth must include a month': PRIORITY.MISSING_FIELDS,
  'Date of birth must include a year': PRIORITY.MISSING_FIELDS,
  'Day must be a number between 1 and 31': PRIORITY.FORMAT_DAY,
  'Month must be a number between 1 and 12': PRIORITY.FORMAT_MONTH,
  'Year must be a 4-digit number': PRIORITY.FORMAT_YEAR,
  'Date of birth must be a real date': PRIORITY.REAL_DATE,
  'Date of birth must be today or in the past': PRIORITY.FUTURE_DATE,
  'Enter the date of birth, or select \'Cancel\'': PRIORITY.UNCHANGED
};

/**
 * Filter errors to show only highest priority category
 * Allows multiple errors within the same priority level (e.g., multiple missing fields)
 * @param {ValidationError[]} errors - Array of validation errors to filter
 * @returns {ValidationError[]} Filtered array containing only highest priority errors
 */
function filterToHighestPriority(errors: ValidationError[]): ValidationError[] {
  if (errors.length <= SINGLE_ERROR_THRESHOLD) return errors;
  
  // Find the highest priority (lowest number) among all errors
  const highestPriority = Math.min(
    ...errors.map(error => ERROR_PRIORITY[error.msg] ?? PRIORITY.UNKNOWN)
  );
  
  // Return all errors that have the highest priority
  const filtered = errors.filter(error => 
    (ERROR_PRIORITY[error.msg] ?? PRIORITY.UNKNOWN) === highestPriority
  );
  
  return filtered;
}

/**
 * Format validation errors for GOV.UK templates
 * @param {ValidationError[]} errors - Array of validation errors from express-validator
 * @returns {object} Formatted error object with inputErrors, errorSummaryList, and formIsInvalid properties
 */
export function formatValidationErrors(errors: ValidationError[]): {
  inputErrors: Record<string, { text: string; fieldName: string }>;
  errorSummaryList: Array<{ text: string; href: string }>;
  formIsInvalid: boolean;
} {
  if (errors.length === ZERO_ERRORS) {
    return {
      inputErrors: {},
      errorSummaryList: [],
      formIsInvalid: false
    };
  }
  
  // Filter to only highest priority error category
  const filteredErrors = filterToHighestPriority(errors);
  
  const inputErrors: Record<string, { text: string; fieldName: string }> = {};
  const errorSummaryList: Array<{ text: string; href: string }> = [];
  
  filteredErrors.forEach(error => {
    const fieldName = error.path ?? 'dateOfBirth-day';
    const href = `#${fieldName}`;
    
    inputErrors[fieldName] = {
      text: error.msg,
      fieldName
    };
    
    errorSummaryList.push({
      text: error.msg,
      href
    });
  });
  
  return {
    inputErrors,
    errorSummaryList,
    formIsInvalid: errorSummaryList.length > ZERO_ERRORS
  };
}
