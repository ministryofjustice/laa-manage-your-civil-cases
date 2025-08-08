import type { CustomValidator, Meta, Schema } from 'express-validator';
import {
  MIN_DAY,
  MAX_DAY,
  MIN_MONTH,
  MAX_MONTH
} from '#src/constants/dateConstants.js';
import {
  type DateFields,
  getDateFields,
  isRealDate,
  isNotFutureDate,
  isUnchangedDate
} from '#src/helpers/dateValidationHelpers.js';
import { DATE_VALIDATION_MESSAGES } from '../constants/errorMessages.js';

/**
 * @file Date of Birth Schema Validation - Simplified Inline Logic
 * 
 * This schema provides direct custom validation functions for each date field,
 * eliminating the need for complex abstraction layers. All validation logic
 * is consolidated directly in the schema for improved maintainability.
 * 
 * **Key Features:**
 * - Direct inline validation logic (no external validator dependencies)
 * - AC-validated error messages from DATE_VALIDATION_MESSAGES
 * - Simple Error throwing with formatter-based priority mapping
 * - Field-specific and global validation rules
 * - Clean separation: day field handles global validations, other fields handle field-specific only
 * 
 * @version 2.0.0 - Simplified schema architecture
 * @since 2025-08-06
 */

/**
 * Type-safe helper to throw UX-validated error messages (AC-compliant)
 * 
 * @param {string} message - Error message from DATE_VALIDATION_MESSAGES
 * @returns {never} Never returns, always throws
 */


/**
 * Type-safe number validation helper for range checking
 * 
 * @param {string} value - String value to validate
 * @param {number} min - Minimum valid value (inclusive)
 * @param {number} max - Maximum valid value (inclusive)
 * @param {string} errorMessage - Error message to throw if validation fails
 * @returns {number} Parsed number if valid
 */
/**
 * Helper function to validate a number is within the given range
 * @param {string} value - The value to validate
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value  
 * @param {string} errorMessage - Error message to throw if invalid
 */
const validateNumberInRange = (value: string, min: number, max: number, errorMessage: string): void => {
  const numValue = parseInt(value, 10);
  if (isNaN(numValue) || numValue < min || numValue > max) {
    throw new Error(errorMessage);
  }
};

/**
 * Helper function to validate global date business rules
 * @param {DateFields} dateFields - The date fields to validate
 * @param {Record<string, unknown>} body - The request body containing form data
 */
const validateGlobalDateRules = (dateFields: DateFields, body: Record<string, unknown>): void => {
  const { day, month, year } = dateFields;
  
  if (day !== '' && month !== '' && year !== '') {
    // Priority 4: Real date validation - AC-validated message  
    if (!isRealDate(day, month, year)) {
      throw new Error(DATE_VALIDATION_MESSAGES.INVALID_DATE);
    }
    
    // Priority 5: Future date validation - AC-validated message
    if (!isNotFutureDate(day, month, year)) {
      throw new Error(DATE_VALIDATION_MESSAGES.FUTURE_DATE);
    }
    
    // Priority 6: Date changed validation - AC-validated message
    if (isUnchangedDate(body)) {
      throw new Error(DATE_VALIDATION_MESSAGES.UNCHANGED);
    }
  }
};

/**
 * Day Field Validator - Handles global validations and day-specific validation
 
/**
 * Type guard to check if value is a valid object for req.body
 * 
 * @param {unknown} value - The value to check
 * @returns {boolean} True if value is a valid object
 */
function isValidBody(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

/**
 * Day field validator - handles all global validations to prevent duplicates
 * 
 * This validator handles:
 * - All fields missing validation (priority 5, global)
 * - Individual day missing validation (priority 10, field-specific)
 * - Day format validation (priority 15, field-specific)
 * - Global business rules (priority 20-30, global):
 *   - Real date validation
 *   - Future date validation  
 *   - Unchanged validation
 * 
 * @param {any} value - Field value being validated
 * @param {object} meta - Express-validator meta object
 * @param {object} meta.req - Express request object
 * @returns {boolean} True if validation passes
 */
const dayValidator: CustomValidator = (value: string, meta: Meta): true => {
  const body = isValidBody(meta.req.body) ? meta.req.body : {};
  const { day, month, year }: DateFields = getDateFields(body);
  
  // Priority 1: All fields missing - AC-validated message
  if (day === '' && month === '' && year === '') {
    throw new Error(DATE_VALIDATION_MESSAGES.ALL_MISSING);
  }
  
  // Priority 2: Individual missing day field - AC-validated message
  if (day === '' && (month !== '' || year !== '')) {
    throw new Error(DATE_VALIDATION_MESSAGES.DAY_MISSING);
  }
  
  // Priority 3: Day format validation - AC-validated message
  if (day !== '') {
    validateNumberInRange(day, MIN_DAY, MAX_DAY, DATE_VALIDATION_MESSAGES.DAY_FORMAT);
  }
  
  // Priority 4-6: Global business rules (only run from day field to avoid duplicates)
  validateGlobalDateRules({ day, month, year }, body);
  
  return true;
};

/**
 * Month field validator - simplified field-specific logic only
 * 
 * This validator handles:
 * - Individual month missing validation (priority 10, field-specific)
 * - Month format validation (priority 15, field-specific)
 * 
 * Global validations are skipped to prevent duplicates (handled by day field).
 * 
 * @param {any} value - Field value being validated
 * @param {object} meta - Express-validator meta object
 * @param {object} meta.req - Express request object
 * @returns {boolean} True if validation passes
 */
const monthValidator: CustomValidator = (value: string, meta: Meta): true => {
  const body = isValidBody(meta.req.body) ? meta.req.body : {};
  const { day, month, year }: DateFields = getDateFields(body);
  
  // Skip global validations - handled by day field
  // Individual missing month field - AC-validated message
  if (month === '' && (day !== '' || year !== '')) {
    throw new Error(DATE_VALIDATION_MESSAGES.MONTH_MISSING);
  }
  
  // Month format validation - AC-validated message
  if (month !== '') {
    validateNumberInRange(month, MIN_MONTH, MAX_MONTH, DATE_VALIDATION_MESSAGES.MONTH_FORMAT);
  }
  
  return true;
};

/**
 * Year field validator - simplified field-specific logic only
 * 
 * This validator handles:
 * - Individual year missing validation (priority 10, field-specific)
 * - Year format validation (priority 15, field-specific)
 * 
 * Global validations are skipped to prevent duplicates (handled by day field).
 * 
 * @param {any} value - Field value being validated
 * @param {object} meta - Express-validator meta object
 * @param {object} meta.req - Express request object
 * @returns {boolean} True if validation passes
 */
const yearValidator: CustomValidator = (value: string, meta: Meta): true => {
  const body = isValidBody(meta.req.body) ? meta.req.body : {};
  const { day, month, year }: DateFields = getDateFields(body);
  
  // Skip global validations - handled by day field
  // Individual missing year field - AC-validated message
  if (year === '' && (day !== '' || month !== '')) {
    throw new Error(DATE_VALIDATION_MESSAGES.YEAR_MISSING);
  }
  
  // Year format validation - AC-validated message
  if (year !== '') {
    // Year format validation with AC-validated message
    if (!/^\d{4}$/.test(year) || year.startsWith('0')) {
      throw new Error(DATE_VALIDATION_MESSAGES.YEAR_FORMAT);
    }
  }
  
  return true;
};

/**
 * Enhanced Date of Birth Schema using direct custom validator functions
 * 
 * This schema eliminates the abstraction layer of the old `isValidDateOfBirth: true`
 * pattern in favor of direct inline validation logic. Each field has its own
 * custom validator function that handles the appropriate validation scope.
 * 
 * **Benefits of Enhanced Schema Approach:**
 * - ✅ **Keeps Existing Structure**: No breaking changes to current schema usage
 * - ✅ **UX-Validated Messages**: All error messages exactly as specified in AC
 * - ✅ **Simplified Logic**: All validation logic directly visible in schema file
 * - ✅ **Eliminates Abstraction**: No complex rule arrays or metaprogramming
 * - ✅ **Easy Maintenance**: Changes made directly in single schema file
 * - ✅ **Message-Based Priority**: Formatter handles priority and global scope
 * 
 * @constant {Schema} dateOfBirthSchema
 */
export const dateOfBirthSchema: Schema = {
  'dateOfBirth-day': {
    custom: {
      options: dayValidator  // All validation logic including global validations
    }
  },
  'dateOfBirth-month': {
    custom: {
      options: monthValidator  // Simplified field validation only
    }
  },
  'dateOfBirth-year': {
    custom: {
      options: yearValidator  // Simplified field validation only
    }
  }
};
