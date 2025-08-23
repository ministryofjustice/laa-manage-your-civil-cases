import { hasProperty, safeString, extractFormFields } from './dataTransformers.js';
import { dateStringFromThreeFields } from './dateFormatter.js';
import { t } from './i18nLoader.js';
import type { ValidationErrorData } from './ValidationErrorHelpers.js';
import type { Request, Response } from 'express';
import type { Result } from 'express-validator';

// Constants for magic numbers
const MINIMUM_YEAR = 1;
const BAD_REQUEST = 400;
const NO_EMPTY_FIELDS = 0;
const ONE_FIELD = 1;
const TWO_FIELDS = 2;
const THREE_FIELDS = 3;

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
 * Extracts date fields from request body and converts to date string if all fields are present
 * @param {Request} req - Express request object
 * @param {string[]} fieldNames - Array of field names to extract (e.g., ['dateOfBirth-day', 'dateOfBirth-month', 'dateOfBirth-year'])
 * @returns {string} Date string in YYYY-MM-DD format if all fields present, empty string otherwise
 */
export function extractAndConvertDateFields(req: Request, fieldNames: [string, string, string]): string {
  const [dayField, monthField, yearField] = fieldNames;

  // Use existing extractFormFields helper for consistent extraction
  const formFields = extractFormFields(req.body, fieldNames);

  const { [dayField]: day, [monthField]: month, [yearField]: year } = formFields;

  // Return date string only if all fields are non-empty
  return (day !== '' && month !== '' && year !== '')
    ? dateStringFromThreeFields(day, month, year)
    : '';
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

  // Filter errors based on field completeness
  const relevantErrors = filterDateOfBirthErrors({ day, month, year }, allErrors);
  /**
   * Filters date of birth validation errors based on simplified rules
   * Shows only the first error unless there are multiple missing fields to consolidate
   * @param {DateFormData} formData - The form data containing day, month, year
   * @param {ValidationErrorData[]} allErrors - All validation errors
   * @returns {ValidationErrorData[]} Filtered relevant errors
   */
  function filterDateOfBirthErrors(formData: DateFormData, allErrors: ValidationErrorData[]): ValidationErrorData[] {
    const firstError = 0
    // If no errors, return empty array
    if (allErrors.length === NO_EMPTY_FIELDS) {
      return [];
    }

    const { day, month, year } = formData;

    // Check for multiple missing fields - these should be consolidated
    const missingFields: string[] = [];
    if (day === '') missingFields.push('day');
    if (month === '') missingFields.push('month');
    if (year === '') missingFields.push('year');

    // If multiple fields are missing, consolidate them into a single error
    if (missingFields.length > ONE_FIELD) {
      return buildMissingFieldsError(missingFields);
    }

    // For all other cases, show only the first error
    // This takes advantage of the predictable validation ordering
    return [allErrors[firstError]];
  }

  // Build error summary list with filtered errors
  const errorSummaryList = relevantErrors.map(error => ({
    text: error.summaryMessage,
    href: '#dateOfBirth',
  }));

  // Use the first relevant error for inline message
  const firstError = relevantErrors.length > NO_EMPTY_FIELDS ? relevantErrors[NO_EMPTY_FIELDS] : undefined;
  const inlineErrorMessage = firstError?.inlineMessage ?? '';
  const originalData = extractOriginalDateData(bodyWithDates);

  // Smart highlighting - determine which fields should be highlighted based on error messages
  const { highlightDay, highlightMonth, highlightYear } = getDateFieldHighlights(allErrors);

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
  /**
   * Builds a missing fields error message for date of birth validation
   * @param {string[]} missingFields - Array of missing field names (day, month, year)
   * @returns {ValidationErrorData[]} Array with a single error object, or empty if no fields missing
   */
  function buildMissingFieldsError(missingFields: string[]): ValidationErrorData[] {
    if (missingFields.length === NO_EMPTY_FIELDS) return [];
    const orderedFields = ['day', 'month', 'year'].filter(f => missingFields.includes(f));

    // If all three fields are missing, use the allEmpty translation
    if (orderedFields.length === THREE_FIELDS) {
      return [{
        summaryMessage: t('forms.clientDetails.dateOfBirth.validationError.allEmpty'),
        inlineMessage: t('forms.clientDetails.dateOfBirth.validationError.allEmpty')
      }];
    }
    // For day or month missing fields, build the dynamic message
    let fieldText = '';
    if (orderedFields.length === ONE_FIELD) {
      const [firstField] = orderedFields;
      fieldText = firstField;
    } else if (orderedFields.length === TWO_FIELDS) {
      const [firstField, secondField] = orderedFields;
      fieldText = `${firstField} and ${secondField}`;
    }
    return [{
      summaryMessage: t('forms.clientDetails.dateOfBirth.validationError.mustInclude', { field: fieldText }),
      inlineMessage: t('forms.clientDetails.dateOfBirth.validationError.mustInclude', { field: fieldText })
    }];
  }

  /**
   * Determines which date fields should be highlighted based on error messages
   * @param {ValidationErrorData[]} errors - Array of validation errors
   * @returns {{ highlightDay: boolean, highlightMonth: boolean, highlightYear: boolean }} Highlight flags for each field
   */
  function getDateFieldHighlights(errors: ValidationErrorData[]): { highlightDay: boolean, highlightMonth: boolean, highlightYear: boolean } {
    const errorMessages = errors.map(error => error.summaryMessage);

    // Get actual translation strings to match against
    const dayMessages = [
      t('forms.clientDetails.dateOfBirth.validationError.day.notEmpty'),
      t('forms.clientDetails.dateOfBirth.validationError.day.isInt')
    ];

    const monthMessages = [
      t('forms.clientDetails.dateOfBirth.validationError.month.notEmpty'),
      t('forms.clientDetails.dateOfBirth.validationError.month.isInt')
    ];

    const yearMessages = [
      t('forms.clientDetails.dateOfBirth.validationError.year.notEmpty'),
      t('forms.clientDetails.dateOfBirth.validationError.year.isLength'),
      t('forms.clientDetails.dateOfBirth.validationError.year.isInt')
    ];

    return {
      highlightDay: errorMessages.some(msg => dayMessages.includes(msg)),
      highlightMonth: errorMessages.some(msg => monthMessages.includes(msg)),
      highlightYear: errorMessages.some(msg => yearMessages.includes(msg))
    };
  }
}
