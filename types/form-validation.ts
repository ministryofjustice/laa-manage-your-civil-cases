/**
 * Common types and interfaces for form validation and error handling.
 */

export interface ValidationFields {
  fullName?: string;
  existingFullName?: string;
  emailAddress?: string;
  existingEmailAddress?: string;
}

export interface InputError {
  fieldName: string;
  text: string;
}

export interface ErrorSummary {
  text: string;
  href?: string;
}

export interface ReturnValidation {
  isInvalid: boolean;
  errorSummary: ErrorSummary;
  inputError?: InputError;
}

export interface ValidationResult  {
  inputErrors: Record<string, string>;
  errorSummaryList: ErrorSummary[];
  formIsInvalid: boolean;
};