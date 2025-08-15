import { hasProperty, safeString } from './dataTransformers.js';
import type { ValidationErrorData } from './ValidationErrorHelpers.js';
import type { Request, Response } from 'express';
import type { Result } from 'express-validator';

// Constants for magic numbers
const MINIMUM_YEAR = 1;
const BAD_REQUEST = 400;
const NO_EMPTY_FIELDS = 0;
const ALL_FIELDS_MISSING = 3;

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
 * Handles validation errors for date of birth form by rendering the form with error messages
 * Filters errors intelligently - if any field is empty, only show field-missing errors
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
  const allErrors = validationErrors.array();

  // Check if any required fields are empty
  const bodyWithDates = isRequestBodyWithDates(req.body) ? req.body : {};
  const formData = extractDateFormData(bodyWithDates);
  const { day, month, year } = formData;

  // Count empty fields manually to satisfy linter
  let emptyFieldsCount = NO_EMPTY_FIELDS;
  if (day === '') emptyFieldsCount++;
  if (month === '') emptyFieldsCount++;
  if (year === '') emptyFieldsCount++;

  // Filter errors based on field completeness
  const relevantErrors = emptyFieldsCount > NO_EMPTY_FIELDS
    ? allErrors.filter(error => {
      const { summaryMessage } = error;
      // When fields are missing, only show:
      // 1. Individual field missing errors (always show these)
      // 2. Comprehensive error ONLY when ALL fields are missing
      return summaryMessage.includes('must include a day') ||
        summaryMessage.includes('must include a month') ||
        summaryMessage.includes('must include a year') ||
        (emptyFieldsCount === ALL_FIELDS_MISSING && summaryMessage.includes('must include a day, month and year'));
    })
    : allErrors; // Show all errors when all fields are complete

  // Build error summary list with filtered errors
  const errorSummaryList = relevantErrors.map(error => ({
    text: error.summaryMessage,
    href: '#dateOfBirth',
  }));

  // Use the first relevant error for inline message
  const [firstError] = relevantErrors;
  const { inlineMessage: inlineErrorMessage } = firstError;
  const originalData = extractOriginalDateData(bodyWithDates);

  // Smart highlighting - determine which fields should be highlighted based on error messages
  const errorMessages = allErrors.map(error => error.summaryMessage.toLowerCase());

  const highlightDay = errorMessages.some(msg =>
    msg.includes('day') ||
    msg.includes('must include a day') ||
    msg.includes('day must be between')
  );

  const highlightMonth = errorMessages.some(msg =>
    msg.includes('month') ||
    msg.includes('must include a month') ||
    msg.includes('month must be between')
  );

  const highlightYear = errorMessages.some(msg =>
    msg.includes('year') ||
    msg.includes('must include a year') ||
    msg.includes('year must') ||
    msg.includes('must include 4 numbers')
  );

  // Re-render the form with errors and preserve user input
  res.status(BAD_REQUEST).render('case_details/edit-date-of-birth.njk', {
    caseReference,
    formData,
    originalData,
    errorState: {
      hasErrors: true,
      errors: errorSummaryList // Contains errors with automatic prioritization from bail()
    },
    highlightDay,
    highlightMonth,
    highlightYear,
    inlineErrorMessage,
    csrfToken: (req as RequestWithCSRF).csrfToken?.(),
  });
}
