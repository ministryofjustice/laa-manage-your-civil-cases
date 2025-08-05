/**
 * Helper functions for Date of Birth Controller
 * 
 * This module contains all the helper functions extracted from the editDateOfBirthController
 * to improve modularity and testability. These functions handle:
 * 
 * - Data extraction and transformation
 * - Error processing and formatting
 * - Form validation and highlighting logic
 * - Template data preparation
 * 
 * @version 1.0.0 - Extracted from editDateOfBirthController
 * @since 2025-08-07
 */

import type { Request } from 'express';
import type { ValidationError } from 'express-validator';
import { govUkErrorFormatter } from '#src/validation/errorFormatters/govUkErrorFormatter.js';
import { apiService } from '#src/services/apiService.js';
import { 
  formatDateForApi, 
  parseIsoDateToForm 
} from '#src/scripts/helpers/index.js';
import { getDateFields } from '#src/helpers/dateValidationHelpers.js';
import { safeString } from '#src/scripts/helpers/dataTransformers.js';
import type { AxiosInstanceWrapper } from '#types/axios-instance-wrapper.js';
import type { GovUkValidationError } from '#src/validation/types/govUkErrorTypes.js';
import type { ExtendedDateFields } from '#src/types/dateTypes.js';

// Constants
const EMPTY_VALUE = 0;

/**
 * Enhanced Request interface with middleware properties
 */
export interface RequestWithMiddleware extends Request {
  axiosMiddleware: AxiosInstanceWrapper;
  csrfToken?: () => string;
}

/**
 * Type for GOV.UK error summary items
 */
interface GovUkErrorSummaryItem {
  text: string;
  href: string;
}

/**
 * Type for GOV.UK form error data structure
 */
interface GovUkFormErrorData {
  formIsInvalid: boolean;
  inputErrors: Record<string, string>;
  errorSummaryList: readonly GovUkErrorSummaryItem[];
  allErrors: readonly GovUkValidationError[];
}

/**
 * Sorts validation errors by priority (lowest number = highest priority)
 * @param {readonly GovUkValidationError[]} errors - Array of validation errors to sort
 * @returns {GovUkValidationError[]} A new sorted array of validation errors
 */
function sortErrorsByPriority(errors: readonly GovUkValidationError[]): GovUkValidationError[] {
  return [...errors].sort((a, b) => a.priority - b.priority);
}

/**
 * Filters errors to return only those with the highest priority (lowest number)
 * @param {readonly GovUkValidationError[]} errors - Array of validation errors to filter
 * @returns {GovUkValidationError[]} Array containing only the highest priority errors
 */
function filterToHighestPriority(errors: readonly GovUkValidationError[]): GovUkValidationError[] {
  const NO_ERRORS_LENGTH = 0;
  if (errors.length === NO_ERRORS_LENGTH) return [];
  
  const sortedErrors = sortErrorsByPriority(errors);
  const [firstError] = sortedErrors;
  const { priority: highestPriority } = firstError;
  
  return sortedErrors.filter(error => error.priority === highestPriority);
}

/**
 * Creates complete form error data structure for GOV.UK templates
 * @param {readonly GovUkValidationError[]} errors - Array of validation errors to process
 * @param {boolean} [useHighestPriorityOnly=true] - Whether to filter to only highest priority errors
 * @returns {GovUkFormErrorData} Complete error data structure for template rendering
 */
function createFormErrorData(
  errors: readonly GovUkValidationError[],
  useHighestPriorityOnly = true
): GovUkFormErrorData {
  const displayErrors = useHighestPriorityOnly 
    ? filterToHighestPriority(errors)
    : sortErrorsByPriority(errors);

  const inputErrors: Record<string, string> = {};
  const errorSummaryList: GovUkErrorSummaryItem[] = [];

  for (const error of displayErrors) {
    const { param, msg, href } = error;
    inputErrors[param] = msg;
    errorSummaryList.push({
      text: msg,
      href
    });
  }

  const ZERO_ERRORS = 0;
  return {
    formIsInvalid: errors.length > ZERO_ERRORS,
    inputErrors: Object.freeze(inputErrors),
    errorSummaryList: Object.freeze(errorSummaryList),
    allErrors: Object.freeze([...errors])
  };
}

/**
 * Extract inline error message(s) for date field
 * @param {Record<string, string>} inputErrors - Processed input errors from createFormErrorData
 * @returns {string} Single error message or multiple errors concatenated with newlines for inline display
 */
export function getDateInlineErrorMessage(inputErrors: Record<string, string>): string {
  const errorMessages: string[] = [];
  
  // Collect all non-empty error messages for date fields
  if (inputErrors['dateOfBirth-day'] !== '') {
    errorMessages.push(inputErrors['dateOfBirth-day']);
  }
  if (inputErrors['dateOfBirth-month'] !== '') {
    errorMessages.push(inputErrors['dateOfBirth-month']);
  }
  if (inputErrors['dateOfBirth-year'] !== '') {
    errorMessages.push(inputErrors['dateOfBirth-year']);
  }
  
  // Return concatenated messages with newlines, or empty string if no errors
  return errorMessages.join('\n');
}

/**
 * Enhanced field highlighting logic for date components with priority-based error analysis
 * 
 * This function provides sophisticated highlighting logic that works seamlessly with
 * the new direct schema validation approach. It follows GOV.UK Design System guidelines
 * for error highlighting based on error priority and type.
 * 
 * **Highlighting Rules:**
 * - Global errors (highest priority): Highlight ALL fields when the top priority error is global
 * - Field-specific errors: Highlight ONLY the specific fields with errors
 * - Multiple missing fields: Highlight only the fields that are actually empty/invalid
 * 
 * **Implementation Note:**
 * This function now checks what errors are actually shown to the user (inputErrors)
 * and cross-references with the original error metadata to determine global vs field-specific
 * highlighting behavior.
 * 
 * @param {Record<string, string>} inputErrors - Processed input errors from createFormErrorData
 * @param {GovUkValidationError[]} govUkErrors - Original errors with metadata from formatter
 * @returns {object} Boolean flags for each field highlighting with priority-based logic
 */
export function getDateFieldHighlighting(
  inputErrors: Record<string, string>, 
  govUkErrors: GovUkValidationError[]
): {
  highlightDay: boolean;
  highlightMonth: boolean;
  highlightYear: boolean;
} {
  // If no errors are shown to the user, no highlighting
  const hasAnyFieldErrors = Object.values(inputErrors).some(error => error !== '');
  if (!hasAnyFieldErrors) {
    return {
      highlightDay: false,
      highlightMonth: false,
      highlightYear: false
    };
  }

  // Get the highest priority errors that were actually processed by createFormErrorData
  const topPriorityErrors = filterToHighestPriority(govUkErrors);
  
  // Check if any of the top priority errors are global
  const hasGlobalError = topPriorityErrors.some((error: GovUkValidationError) => error.isGlobal);
  
  // If the highest priority error is global, highlight ALL fields
  if (hasGlobalError) {
    return {
      highlightDay: true,
      highlightMonth: true,
      highlightYear: true
    };
  }
  
  // For field-specific errors, highlight only the specific fields that have errors in topPriorityErrors
  // This ensures we only highlight fields where errors are actually shown to the user
  const hasSpecificDayError = topPriorityErrors.some((error: GovUkValidationError) => error.param === 'dateOfBirth-day');
  const hasSpecificMonthError = topPriorityErrors.some((error: GovUkValidationError) => error.param === 'dateOfBirth-month');
  const hasSpecificYearError = topPriorityErrors.some((error: GovUkValidationError) => error.param === 'dateOfBirth-year');
  return {
    highlightDay: hasSpecificDayError,
    highlightMonth: hasSpecificMonthError,
    highlightYear: hasSpecificYearError
  };
}

/**
 * Safely extract and clean a property from request body
 * @param {Record<string, unknown>} body - Request body object
 * @param {string} property - Property name to extract
 * @returns {string} Cleaned string value or empty string
 */
function safeExtractProperty(body: Record<string, unknown>, property: string): string {
  return safeString(body[property]).trim();
}

/**
 * Type guard to check if a value is a record object
 * @param {unknown} value - Value to check
 * @returns {boolean} True if value is a record object
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Extract form data from request body
 * @param {RequestWithMiddleware} req - Express request object
 * @returns {ExtendedDateFields} Extracted form data with original values
 */
export function extractFormData(req: RequestWithMiddleware): ExtendedDateFields {
  const body = isRecord(req.body) ? req.body : {};
  const baseFields = getDateFields(body);
  
  return {
    ...baseFields,
    // Original data for change detection
    originalDay: safeExtractProperty(body, 'originalDay'),
    originalMonth: safeExtractProperty(body, 'originalMonth'),
    originalYear: safeExtractProperty(body, 'originalYear')
  };
}

/**
 * Populate existing date of birth data from API response for form display
 * @param {object} response - API response containing client details
 * @param {string} response.status - Status of the API response
 * @param {object | null} response.data - Data from the API response containing dateOfBirth
 * @returns {object} Parsed date components with day, month, year strings
 */
export function populateExistingDate(response: { status: string; data: { dateOfBirth: string } | null }): { currentDay: string; currentMonth: string; currentYear: string } {
  const defaultResult = { currentDay: '', currentMonth: '', currentYear: '' };
  
  if (response.status !== 'success' || response.data === null || response.data.dateOfBirth === '') {
    return defaultResult;
  }
  
  try {
    const { day, month, year } = parseIsoDateToForm(response.data.dateOfBirth);
    return { currentDay: day, currentMonth: month, currentYear: year };
  } catch (parseError) {
    console.warn('⚠️ Failed to parse existing date of birth:', parseError);
    return defaultResult;
  }
}

/**
 * Generate CSRF token safely
 * @param {RequestWithMiddleware} req - Request object that may contain csrfToken function
 * @returns {string} CSRF token string or empty string
 */
export function generateCsrfToken(req: RequestWithMiddleware): string {
  return (
    'csrfToken' in req && 
    typeof req.csrfToken === 'function'
  ) ? req.csrfToken() : '';
}

/**
 * Type guard to check if an object is a GovUkValidationError
 * @param {unknown} obj - Object to check
 * @returns {boolean} True if the object is a GovUkValidationError
 */
function isGovUkValidationError(obj: unknown): obj is GovUkValidationError {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'param' in obj &&
    'msg' in obj &&
    'priority' in obj &&
    'href' in obj
  );
}

/**
 * Process validation errors with enhanced debugging
 * @param {ValidationError[]} rawErrors - Array of raw validation errors from express-validator
 * @returns {GovUkValidationError[]} Array of processed GovUk validation errors
 */
export function processValidationErrors(rawErrors: ValidationError[]): GovUkValidationError[] {
  // Transform errors using our formatter which returns GovUkValidationError objects
  const transformedErrors: GovUkValidationError[] = rawErrors
    .map((error) => {
      const formatted = govUkErrorFormatter(error);
      if (isGovUkValidationError(formatted)) {
        return formatted;
      } else {
        console.warn('⚠️ govUkErrorFormatter returned an invalid error object:', formatted);
        // Optionally, return a default error or skip
        return null;
      }
    })
    .filter((e): e is GovUkValidationError => e !== null);
  
  // Validation error safety check
  if (transformedErrors.length === EMPTY_VALUE && rawErrors.length > EMPTY_VALUE) {
    console.warn('⚠️ Validation errors detected but transformation failed:', rawErrors);
  }
  
  return transformedErrors;
}

/**
 * Create render options for error state
 * @param {string} caseReference - Case reference string
 * @param {ExtendedDateFields} formData - Form data object containing date values and original values
 * @param {GovUkValidationError[]} govUkErrors - Array of processed validation errors
 * @param {RequestWithMiddleware} req - Express request object for CSRF token
 * @returns {Record<string, unknown>} Render options object for template
 */
export function createErrorRenderOptions(
  caseReference: string,
  formData: ExtendedDateFields,
  govUkErrors: GovUkValidationError[],
  req: RequestWithMiddleware
): Record<string, unknown> {
  const { formIsInvalid, inputErrors, errorSummaryList } = createFormErrorData(govUkErrors, true);
  
  // Enhanced date-specific display logic with robust error handling
  const inlineErrorMessage = getDateInlineErrorMessage(inputErrors);
  const fieldHighlighting = getDateFieldHighlighting(inputErrors, govUkErrors);
  
  const renderOptions = {
    caseReference,
    currentDay: formData.day,
    currentMonth: formData.month,
    currentYear: formData.year,
    originalDay: formData.originalDay,
    originalMonth: formData.originalMonth,
    originalYear: formData.originalYear,
    formData: {
      day: formData.day,
      month: formData.month,
      year: formData.year
    },
    originalData: {
      day: formData.originalDay,
      month: formData.originalMonth,
      year: formData.originalYear
    },
    errorState: {
      hasErrors: formIsInvalid,
      errors: errorSummaryList,
      fieldErrors: inputErrors,
      totalErrorCount: govUkErrors.length,
      globalErrorCount: govUkErrors.filter(e => e.isGlobal).length
    },
    error: {
      inputErrors,
      errorSummaryList
    },
    inlineErrorMessage,
    highlightDay: fieldHighlighting.highlightDay,
    highlightMonth: fieldHighlighting.highlightMonth,
    highlightYear: fieldHighlighting.highlightYear,
    csrfToken: generateCsrfToken(req)
  };
  
  return renderOptions;
}

/**
 * Handle successful date update
 * @param {RequestWithMiddleware} req - Express request object
 * @param {string} caseReference - Case reference string
 * @param {ExtendedDateFields} formData - Form data object with date values and original values
 * @returns {Promise<string>} Promise resolving to formatted date string or throwing error
 */
export async function handleSuccessfulUpdate(
  req: RequestWithMiddleware,
  caseReference: string,
  formData: ExtendedDateFields
): Promise<string> {
  const { day, month, year } = formData;
  
  // Date formatting with validation
  const formattedDate = formatDateForApi(day, month, year);
  
  // API call with comprehensive error handling
  await apiService.updateClientDetails(req.axiosMiddleware, caseReference, { 
    dateOfBirth: formattedDate 
  });
  
  return formattedDate;
}
