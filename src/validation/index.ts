/**
 * @file LAA Custom Validation Module
 * 
 * Enhanced with type-safe GOV.UK error handling for express-validator integration.
 * Provides schema-based validation with discriminated union types and error factory patterns.
 * 
 * @module validation/index
 * @version 1.0.0
 * @since 2025-08-05
 */


// Main exports - Express-validator functions and GOV.UK error formatter
export {
  body,
  checkSchema,
  validationResult,
  check,
  param,
  query,
  header,
  cookie
} from 'express-validator';

export { govUkErrorFormatter } from './errorFormatters/govUkErrorFormatter.js';

// 🆕 GOV.UK error types and utilities
export type {
  GovUkValidationError,
  GovUkComplexValidationError,
  GovUkFormErrorData,
  GovUkErrorSummaryItem,
  ErrorCode,
  ErrorPriority
} from './types/govUkErrorTypes.js';

// Constants
export {
  ERROR_PRIORITIES,
  ERROR_CODES
} from './types/govUkErrorTypes.js';

// Validation schemas
export {
  dateOfBirthSchema
} from './schemas/dateOfBirthSchema.js';
