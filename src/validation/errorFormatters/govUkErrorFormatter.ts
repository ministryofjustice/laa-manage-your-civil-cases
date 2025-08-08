/**
 * GOV.UK Error Formatter for express-validator
 * 
 * This formatter creates GOV.UK Design System compatible errors using message-based
 * priority determination instead of attempting to preserve custom properties.
 * 
 * @module govUkErrorFormatter
 */

import type { ValidationError, FieldValidationError } from 'express-validator';
import type { GovUkValidationError } from '../types/govUkErrorTypes.js';
import { getMessageMetadata } from '../constants/errorMessages.js';

/**
 * Type guard to check if error is a field validation error
 * 
 * @param {ValidationError} error - The validation error to check
 * @returns {error is FieldValidationError} True if error is a field validation error
 */
function isFieldValidationError(error: ValidationError): error is FieldValidationError {
  return error.type === 'field';
}

/**
 * Type guard to check if error has location property
 * 
 * @param {ValidationError} error - The validation error to check  
 * @returns {boolean} True if error has location property
 */
function hasLocation(error: ValidationError): error is ValidationError & { location: string } {
  return 'location' in error && typeof (error as { location?: unknown }).location === 'string';
}

/**
 * Type guard to check if error has value property
 * 
 * @param {ValidationError} error - The validation error to check
 * @returns {boolean} True if error has value property  
 */
function hasValue(error: ValidationError): error is ValidationError & { value: unknown } {
  return 'value' in error;
}

/**
 * Safely extracts the parameter path from validation error
 * 
 * @param {ValidationError} error - The validation error
 * @returns {string} The parameter path or 'unknown' as fallback
 */
function extractPath(error: ValidationError): string {
  if (isFieldValidationError(error)) {
    const { path } = error;
    return Array.isArray(path) ? path.join('.') : (path === '' ? 'unknown' : path);
  }
  return 'unknown';
}

/**
 * Extracts field name from compound parameters
 * 
 * @param {string} path - The parameter path
 * @returns {string} The extracted field name
 */
function extractFieldName(path: string): string {
  if (path.includes('-')) {
    const parts = path.split('-');
    const lastPart = parts.pop();
    return lastPart === '' || lastPart === undefined ? path : lastPart;
  }
  return path;
}

/**
 * Safely extracts location from validation error
 * 
 * @param {ValidationError} error - The validation error
 * @returns {string} The location or 'body' as fallback
 */
function extractLocation(error: ValidationError): string {
  return hasLocation(error) ? error.location : 'body';
}

/**
 * Safely extracts value from validation error
 * 
 * @param {ValidationError} error - The validation error
 * @returns {unknown} The value if present, undefined otherwise
 */
function extractValue(error: ValidationError): unknown {
  return hasValue(error) ? error.value : undefined;
}

/**
 * Express-validator error formatter that creates GOV.UK Design System compatible errors.
 * 
 * This formatter uses message-based priority determination via getMessageMetadata()
 * instead of attempting to preserve custom properties that are stripped by express-validator.
 * 
 * **Key Features:**
 * - Message-based priority and global scope determination
 * - Type-safe error property extraction with fallbacks
 * - Maintains express-validator compatibility
 * - Creates accessibility-compliant href links
 * - Comprehensive type safety with proper TypeScript interfaces
 * 
 * @param {ValidationError} error - Express-validator ValidationError object
 * @returns {GovUkValidationError} GOV.UK compliant validation error with metadata
 * 
 * @example
 * ```typescript
 * // Used automatically by express-validator when configured
 * const { validationResult } = customExpressValidator;
 * const errors = validationResult(req).array(); // Formatted by this function
 * ```
 */
export const govUkErrorFormatter = (error: ValidationError): GovUkValidationError => {
  // Type-safe parameter extraction with fallbacks
  const path = extractPath(error);
  const fieldName = extractFieldName(path);
  const location = extractLocation(error);
  const value = extractValue(error);
  
  // Ensure error message is a string
  const errorMessage = typeof error.msg === 'string' ? error.msg : String(error.msg);
  
  // Get message metadata using type-safe helper function
  const messageMeta = getMessageMetadata(errorMessage);
  const { priority, isGlobal, code } = messageMeta;
  
  // Type-safe error object construction extending Error
  const baseError = new Error(errorMessage);
  const formattedError: GovUkValidationError = Object.assign(baseError, {
    msg: errorMessage,
    param: path,
    href: path !== 'unknown' ? `#${path}` : '#unknown',
    type: 'validation_error' as const,
    fieldName,
    priority,
    timestamp: new Date().toISOString(),
    isGlobal,
    ...(code !== undefined && { code })
  });

  // Add additional properties that may be useful but aren't in the core interface
  if (value !== undefined) {
    Object.defineProperty(formattedError, 'value', {
      value,
      enumerable: true,
      writable: false
    });
  }
  
  Object.defineProperty(formattedError, 'location', {
    value: location,
    enumerable: true,
    writable: false
  });

  return formattedError;
};
