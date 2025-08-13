import type { ValidationError, Result } from 'express-validator';
import type { Request, Response } from 'express';
import { isRecord, hasProperty, safeString } from './dataTransformers.js';

/**
 * Interface for validation error data structure
 */
export interface ValidationErrorData {
  summaryMessage: string;
  inlineMessage: string;
}

/**
 * Custom error class that extends Error and carries ValidationErrorData
 * This satisfies linting rules while providing type safety
 */
export class TypedValidationError extends Error {
  public readonly errorData: ValidationErrorData;

  /**
   * Creates a new TypedValidationError with structured error data
   * @param {ValidationErrorData} errorData - The validation error data containing summary and inline messages
   */
  constructor(errorData: ValidationErrorData) {
    super(errorData.summaryMessage);
    this.name = 'TypedValidationError';
    this.errorData = errorData;
  }
}

/**
 * Custom error formatter for express-validator that preserves type safety
 * This is the express-validator recommended approach using formatWith()
 * @param {ValidationError} error - The express-validator error object
 * @returns {ValidationErrorData} Typed error data object
 */
export function formatValidationError(error: ValidationError): ValidationErrorData {
  // Handle TypedValidationError instances
  if (error.msg instanceof TypedValidationError) {
    return error.msg.errorData;
  }

  // Handle the case where the error message is already our ValidationErrorData using existing helpers
  if (isRecord(error.msg) &&
    hasProperty(error.msg, 'summaryMessage') &&
    hasProperty(error.msg, 'inlineMessage')) {
    return {
      summaryMessage: safeString(error.msg.summaryMessage),
      inlineMessage: safeString(error.msg.inlineMessage)
    };
  }

  // Fallback: treat the message as both summary and inline
  const safeMessage = safeString(error.msg);
  const message = safeMessage !== '' ? safeMessage : 'Invalid value';
  return {
    summaryMessage: message,
    inlineMessage: message
  };
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
  const BAD_REQUEST = 400;

  // Map validation errors to field names for date of birth form
  const resultingErrors = validationErrors.array().map((errorData: ValidationErrorData) => {
    return {
      fieldName: 'dateOfBirth', // Simple - just use main field for summary href
      inlineMessage: errorData.inlineMessage,
      summaryMessage: errorData.summaryMessage,
    };
  });

  // Build input errors object for individual field error messages
  // Only use inline messages that are not empty
  const inputErrors = resultingErrors.reduce<Record<string, string>>((acc, { fieldName, inlineMessage }) => {
    if (inlineMessage.trim() !== '') {
      acc[fieldName] = inlineMessage;
    }
    return acc;
  }, {});

  // Build error summary list for the error summary component
  const errorSummaryList = resultingErrors.map(({ summaryMessage, fieldName }) => ({
    text: summaryMessage,
    href: `#${fieldName}`,
  }));

  // Get form data from request body to preserve user input
  const formData = {
    day: hasProperty(req.body, 'dateOfBirth-day') ? safeString(req.body['dateOfBirth-day']) : '',
    month: hasProperty(req.body, 'dateOfBirth-month') ? safeString(req.body['dateOfBirth-month']) : '',
    year: hasProperty(req.body, 'dateOfBirth-year') ? safeString(req.body['dateOfBirth-year']) : ''
  };

  const originalData = {
    day: hasProperty(req.body, 'originalDay') ? safeString(req.body.originalDay) : '',
    month: hasProperty(req.body, 'originalMonth') ? safeString(req.body.originalMonth) : '',
    year: hasProperty(req.body, 'originalYear') ? safeString(req.body.originalYear) : ''
  };

  // Simple highlighting - highlight all fields if there's any error
  const hasErrors = Object.keys(inputErrors).length > 0;
  const highlightDay = hasErrors;
  const highlightMonth = hasErrors;
  const highlightYear = hasErrors;

  // Get inline error message
  const inlineErrorMessage = inputErrors['dateOfBirth'] || '';

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
    csrfToken: typeof (req as any).csrfToken === 'function' ? (req as any).csrfToken() : undefined,
  });
}
