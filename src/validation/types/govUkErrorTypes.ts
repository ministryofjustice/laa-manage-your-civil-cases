/**
 * GOV.UK Design System error types and constants.
 * 
 * This module provides TypeScript definitions for GOV.UK compliant
 * validation errors that are template-ready and accessibility compliant.
 * 
 * @module govUkErrorTypes
 */

/**
 * Priority constants for error display ordering
 */
const PRIORITY_MISSING_ALL = 5;
const PRIORITY_MISSING_FIELD = 10;
const PRIORITY_FORMAT_ERROR = 15;
const PRIORITY_BUSINESS_RULE = 20;
const PRIORITY_FUTURE_DATE = 25;
const PRIORITY_PAST_DATE = 30;

export const ERROR_PRIORITIES = {
  MISSING_ALL: PRIORITY_MISSING_ALL,       // All fields missing - highest priority for date inputs
  MISSING_FIELD: PRIORITY_MISSING_FIELD,    // Individual field missing - medium-high priority  
  FORMAT_ERROR: PRIORITY_FORMAT_ERROR,     // Format validation - medium priority
  BUSINESS_RULE: PRIORITY_BUSINESS_RULE,    // Business logic validation - medium priority
  FUTURE_DATE: PRIORITY_FUTURE_DATE,      // Future date validation - lower priority
  PAST_DATE: PRIORITY_PAST_DATE         // Past date validation - lowest priority
} as const;

/**
 * Predefined error codes for programmatic error handling.
 */
export const ERROR_CODES = {
  /** Required field is missing */
  MISSING_REQUIRED: 'MISSING_REQUIRED',
  /** Invalid date format */
  INVALID_DATE: 'INVALID_DATE',
  /** Date is in the future when past date required */
  FUTURE_DATE: 'FUTURE_DATE',
  /** Date is in the past when future date required */
  PAST_DATE: 'PAST_DATE',
  /** Generic format error */
  FORMAT_ERROR: 'FORMAT_ERROR',
  /** Business rule violation */
  BUSINESS_RULE: 'BUSINESS_RULE'
} as const;

/**
 * Type alias for error priority values.
 */
export type ErrorPriority = typeof ERROR_PRIORITIES[keyof typeof ERROR_PRIORITIES];

/**
 * Type alias for error code values.
 */
export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

/**
 * Base GOV.UK validation error structure.
 * 
 * This interface defines the minimum structure required by GOV.UK
 * templates for error display and accessibility compliance.
 */
export interface GovUkValidationError extends Error {
  /** Error message displayed to user */
  readonly msg: string;
  /** Field parameter name (e.g., 'dateOfBirth-day') */
  readonly param: string;
  /** Anchor href for error summary links (e.g., '#dateOfBirth-day') */
  readonly href: string;
  /** Error type discriminator for TypeScript type guards */
  readonly type: 'validation_error';
  /** Extracted field name for conditional logic (e.g., 'day') */
  readonly fieldName: string;
  /** Priority level for error sorting and filtering */
  readonly priority: ErrorPriority;
  /** ISO timestamp when error was created */
  readonly timestamp: string;
  /** Whether this is a global error (affects multiple fields) or field-specific */
  readonly isGlobal: boolean;
  /** Optional error code for programmatic handling */
  readonly code?: ErrorCode;
}

/**
 * Extended GOV.UK validation error with additional context.
 * 
 * Used for complex validation scenarios that require additional
 * metadata or related field information.
 */
export interface GovUkComplexValidationError extends GovUkValidationError {
  /** Related field names for compound validation errors */
  readonly relatedFields?: readonly string[];
  /** Validation rule that triggered the error */
  readonly rule?: string;
  /** Additional context data for error resolution */
  readonly context?: Readonly<Record<string, unknown>>;
}

/**
 * Error summary item structure for GOV.UK error summary component.
 * 
 * Used to populate the error summary list at the top of forms.
 */
export interface GovUkErrorSummaryItem {
  /** Error message text */
  readonly text: string;
  /** Link to the field with error */
  readonly href: string;
}

/**
 * Complete form error data structure for template rendering.
 * 
 * This interface provides all error-related data needed by
 * GOV.UK templates in a single, convenient structure.
 */
export interface GovUkFormErrorData {
  /** Whether the form has validation errors */
  readonly formIsInvalid: boolean;
  /** Map of field names to error messages for input highlighting */
  readonly inputErrors: Readonly<Record<string, string>>;
  /** Array of errors for the error summary component */
  readonly errorSummaryList: readonly GovUkErrorSummaryItem[];
  /** All validation errors for advanced processing */
  readonly allErrors: readonly GovUkValidationError[];
}

/**
 * Type guard to check if an error is a GOV.UK validation error.
 * 
 * @param {unknown} error - Error object to check
 * @returns {boolean} True if error is a GOV.UK validation error
 */
export function isGovUkValidationError(error: unknown): error is GovUkValidationError {
  return error instanceof Error && 
         'type' in error && 
         error.type === 'validation_error' &&
         'param' in error &&
         'href' in error &&
         'priority' in error;
}

/**
 * Type guard to check if an error is a complex GOV.UK validation error.
 * 
 * @param {unknown} error - Error object to check
 * @returns {boolean} True if error is a complex GOV.UK validation error
 */
export function isGovUkComplexValidationError(error: unknown): error is GovUkComplexValidationError {
  return isGovUkValidationError(error) && 
         ('relatedFields' in error || 'rule' in error || 'context' in error);
}
