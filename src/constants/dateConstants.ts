/**
 * Date-related constants for validation and formatting
 * Centralized to avoid duplication across helper files
 */

// Date component validation limits
export const MIN_DAY = 1;
export const MAX_DAY = 31;
export const MIN_MONTH = 1;
export const MAX_MONTH = 12;

// Missing field combination counts
export const ALL_FIELDS_MISSING = 3;
export const TWO_FIELDS_MISSING = 2;

// Formatting constants
export const ZERO_PADDING_LENGTH = 2;
export const DECIMAL_BASE = 10;

// Moment.js specific constants
export const MONTH_INDEX_OFFSET = 1; // Moment.js months are 0-based, user input is 1-based

// Validation priority constants (lower = higher priority)
export const PRIORITY_MISSING_ALL = 1;
export const PRIORITY_MISSING_FIELDS = 5;
export const PRIORITY_FORMAT_DAY = 10;
export const PRIORITY_FORMAT_MONTH = 11;
export const PRIORITY_FORMAT_YEAR = 12;
export const PRIORITY_REAL_DATE = 20;
export const PRIORITY_FUTURE_DATE = 21;
export const PRIORITY_UNCHANGED = 22;
export const PRIORITY_UNKNOWN = 99;

// Error filtering constants
export const SINGLE_ERROR_THRESHOLD = 1;
export const ZERO_ERRORS = 0;
