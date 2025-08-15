import type { ErrorSummary } from './form-validation.js';

/**
 * Represents a form field with its current and existing values
 */
export interface FormField {
  name: string;
  value: string;
  existingValue: string;
}

/**
 * Data structure for rendering templates with error handling
 */
export interface RenderData {
  caseReference: string;
  error?: {
    inputErrors: Record<string, string>;
    errorSummaryList: ErrorSummary[];
  };
  csrfToken?: string;
  [key: string]: unknown;
}

/**
 * Configuration options for GET form handlers
 */
export interface GetFormOptions {
  templatePath: string;
  dataExtractor: (data: unknown) => Record<string, unknown>;
}

/**
 * Configuration options for POST form handlers
 */
export interface PostFormOptions {
  templatePath: string;
  fields: FormField[];
  apiUpdateData: Record<string, unknown>;
  useCustomValidation?: boolean;
}

/**
 * Type guard function type for validating records
 */
export type RecordValidator = (data: unknown) => data is Record<string, unknown>;

// Re-export commonly used validation types for convenience
export type { ValidationResult, ErrorSummary } from './form-validation.js';
