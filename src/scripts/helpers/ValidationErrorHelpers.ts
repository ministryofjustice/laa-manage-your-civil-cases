import type { ValidationError } from 'express-validator';
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
