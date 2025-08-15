import { hasProperty, safeString } from './dataTransformers.js';
import type { ValidationErrorData } from './ValidationErrorHelpers.js';
import type { Request, Response } from 'express';
import type { Result } from 'express-validator';

// Constants for magic numbers
const FIRST_ELEMENT_INDEX = 0;
const MINIMUM_YEAR = 1;
const BAD_REQUEST = 400;

// Interface for request with CSRF token
interface RequestWithCSRF extends Request {
  csrfToken?: () => string;
}

/**
 * Interface for date form data
 */
export interface DateFormData {
  day: string;
  month: string;
  year: string;
}

/**
 * Interface for request body with date fields
 */
export interface RequestBodyWithDates {
  'dateOfBirth-day'?: unknown;
  'dateOfBirth-month'?: unknown;
  'dateOfBirth-year'?: unknown;
  originalDay?: unknown;
  originalMonth?: unknown;
  originalYear?: unknown;
}

/**
 * Type guard to check if request body has date fields structure
 * @param {unknown} body - Request body to check
 * @returns {body is RequestBodyWithDates} True if body has required date fields
 */
export function isRequestBodyWithDates(body: unknown): body is RequestBodyWithDates {
  return typeof body === 'object' && body !== null;
}

/**
 * Three-tier error priority classification for date validation
 */
enum ErrorPriority {
  CRITICAL = 1,    // Required field errors, change detection
  IMPORTANT = 2,   // Format/length validation errors
  STANDARD = 3     // Logical validation (date validity, future dates)
}

/**
 * Parse date string into day, month, year components
 * @param {string} dateString - ISO date string (YYYY-MM-DD) or empty string
 * @returns {DateFormData} Object with day, month, year properties
 */
export function parseDateString(dateString: string): DateFormData {
  if (dateString.trim() === '') {
    return { day: '', month: '', year: '' };
  }


  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return { day: '', month: '', year: '' };
  }

  return {
    day: date.getDate().toString(),
    month: (date.getMonth() + MINIMUM_YEAR).toString(), // getMonth() returns 0-11
    year: date.getFullYear().toString()
  };

}

/**
 * Extract form data from request body for date fields
 * @param {RequestBodyWithDates} body - Express request body
 * @returns {DateFormData} Extracted form data
 */
export function extractDateFormData(body: RequestBodyWithDates): DateFormData {
  return {
    day: hasProperty(body, 'dateOfBirth-day') ? safeString(body['dateOfBirth-day']) : '',
    month: hasProperty(body, 'dateOfBirth-month') ? safeString(body['dateOfBirth-month']) : '',
    year: hasProperty(body, 'dateOfBirth-year') ? safeString(body['dateOfBirth-year']) : ''
  };
}

/**
 * Extract original data from request body for change detection
 * @param {RequestBodyWithDates} body - Express request body
 * @returns {DateFormData} Original data
 */
export function extractOriginalDateData(body: RequestBodyWithDates): DateFormData {
  return {
    day: hasProperty(body, 'originalDay') ? safeString(body.originalDay) : '',
    month: hasProperty(body, 'originalMonth') ? safeString(body.originalMonth) : '',
    year: hasProperty(body, 'originalYear') ? safeString(body.originalYear) : ''
  };
}

/**
 * Check if error message indicates format/length validation error
 * @param {string} summaryMessage - Summary message in lowercase
 * @param {string} inlineMessage - Inline message in lowercase
 * @returns {boolean} True if this is a format/length error
 */
function isFormatError(summaryMessage: string, inlineMessage: string): boolean {
  return summaryMessage.includes('must include 4 numbers') ||
    summaryMessage.includes('must be between') ||
    summaryMessage.includes('must be in the past') ||
    summaryMessage.includes('must be a number') ||
    inlineMessage.includes('must be a number') ||
    inlineMessage.includes('must include 4 numbers');
}

/**
 * Check if error message indicates required field or change detection error
 * @param {string} summaryMessage - Summary message in lowercase
 * @returns {boolean} True if this is a critical error
 */
function isCriticalError(summaryMessage: string): boolean {
  return summaryMessage.includes('must include') || 
    summaryMessage.includes('enter the client') ||
    summaryMessage.includes('update the client') ||
    summaryMessage.includes('select \'cancel\'') ||
    summaryMessage.includes('date of birth is required') ||
    summaryMessage.includes('day is required') ||
    summaryMessage.includes('month is required') ||
    summaryMessage.includes('year is required');
}

/**
 * Determine error priority based on error message content for date validation
 * @param {ValidationErrorData} error - The validation error object
 * @returns {ErrorPriority} Priority level of the error
 */
function determineErrorPriority(error: ValidationErrorData): ErrorPriority {
  const summaryMessage = error.summaryMessage.toLowerCase();
  const inlineMessage = error.inlineMessage.toLowerCase();
  
  // IMPORTANT: Format/length validation errors (check these first to avoid false matches)
  if (isFormatError(summaryMessage, inlineMessage)) {
    return ErrorPriority.IMPORTANT;
  }
  
  // CRITICAL: Required field errors and change detection
  if (isCriticalError(summaryMessage)) {
    return ErrorPriority.CRITICAL;
  }
  
  // STANDARD: Logical validation (date validity, future dates)
  return ErrorPriority.STANDARD;
}

/**
 * Prioritizes validation errors using a three-tier priority system for date validation
 * Returns the single highest priority error for display
 * @param {ValidationErrorData[]} errors - Array of validation errors
 * @returns {ValidationErrorData} The highest priority error
 */
export function prioritizeValidationErrors(errors: ValidationErrorData[]): ValidationErrorData {
  if (errors.length === FIRST_ELEMENT_INDEX) {
    throw new Error('Cannot prioritize empty error array');
  }
  
  if (errors.length === MINIMUM_YEAR) {
    return errors[FIRST_ELEMENT_INDEX];
  }
  
  // Sort errors by priority (highest first)
  const prioritizedErrors = errors
    .map(error => ({
      error,
      priority: determineErrorPriority(error)
    }))
    .sort((a, b) => {
      // Sort by priority enum value (CRITICAL=1, IMPORTANT=2, STANDARD=3)
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      // If same priority, maintain original order
      return FIRST_ELEMENT_INDEX;
    });
  
  return prioritizedErrors[FIRST_ELEMENT_INDEX].error;
}

/**
 * Handles validation errors for date of birth form by rendering the form with error messages
 * @param {Result<ValidationErrorData>} validationErrors - Validation errors from express-validator
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {string} caseReference - Case reference number
 */
export function handleDateOfBirthValidationErrors(
  validationErrors: Result<ValidationErrorData>,
  req: Request,
  res: Response,
  caseReference: string
): void {
  // Use sophisticated error prioritization to get the single highest priority error
  const prioritizedError = prioritizeValidationErrors(validationErrors.array());
  
  // Build error summary list for the error summary component
  const errorSummaryList = [{
    text: prioritizedError.summaryMessage,
    href: '#dateOfBirth',
  }];

  // Get form data from request body to preserve user input
  const bodyWithDates = isRequestBodyWithDates(req.body) ? req.body : {};
  const formData = extractDateFormData(bodyWithDates);
  const originalData = extractOriginalDateData(bodyWithDates);

  // Use the prioritized error's inline message
  const { inlineMessage: inlineErrorMessage } = prioritizedError;
  
  // Simple highlighting - highlight all fields if there's any inline error
  const highlightDay = /day/i.test(inlineErrorMessage);
  const highlightMonth = /month/i.test(inlineErrorMessage);
  const highlightYear = /year/i.test(inlineErrorMessage);

  // Re-render the form with errors and preserve user input
  res.status(BAD_REQUEST).render('case_details/edit-date-of-birth.njk', {
    caseReference,
    formData,
    originalData,
    errorState: {
      hasErrors: true,
      errors: errorSummaryList
    },
    highlightDay,
    highlightMonth,
    highlightYear,
    inlineErrorMessage,
    csrfToken: (req as RequestWithCSRF).csrfToken?.(),
  });
}
