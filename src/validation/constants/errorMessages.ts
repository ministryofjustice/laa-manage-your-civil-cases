import { ERROR_PRIORITIES, ERROR_CODES, type ErrorPriority, type ErrorCode } from '../types/govUkErrorTypes.js';

/**
 * @file Date of Birth Error Messages and Priority Mapping
 * 
 * This module provides AC-validated error messages and their corresponding
 * priority mappings for the Date of Birth validation system. All error messages
 * have been validated by the UX team and must be used exactly as specified.
 * 
 * **Key Features:**
 * - Type-safe message constants with literal types
 * - Complete message-to-priority mapping using existing ERROR_PRIORITIES
 * - Compile-time validation for mapping completeness
 * - Runtime type guards for safe fallback behavior
 * 
 * @version 1.0.0
 * @since 2025-08-06
 */

// Type-safe message constants with literal types (AC-validated by UX team)
export const DATE_VALIDATION_MESSAGES = {
  ALL_MISSING: 'Enter the date of birth',
  DAY_MISSING: 'Date of birth must include a day',
  MONTH_MISSING: 'Date of birth must include a month', 
  YEAR_MISSING: 'Date of birth must include a year',
  INVALID_DATE: 'Date of birth must be a real date',
  FUTURE_DATE: 'Date of birth must be today or in the past',
  UNCHANGED: 'Enter the date of birth, or select \'Cancel\'',
  DAY_FORMAT: 'Day must be a number between 1 and 31',
  MONTH_FORMAT: 'Month must be a number between 1 and 12',
  YEAR_FORMAT: 'Year must be a 4-digit number'
} as const;

// Type-safe message keys
export type DateValidationMessage = typeof DATE_VALIDATION_MESSAGES[keyof typeof DATE_VALIDATION_MESSAGES];

/**
 * Type-safe metadata interface for validation message properties
 * 
 * Defines the structure for metadata associated with each validation message,
 * including priority level, global vs field-specific scope, and error codes.
 */
export interface ValidationMessageMetadata {
  /** Priority level from existing ERROR_PRIORITIES constants */
  readonly priority: ErrorPriority;
  /** Whether error affects all date fields (true) or specific field (false) */
  readonly isGlobal: boolean;
  /** Optional error code from existing ERROR_CODES constants */
  readonly code?: ErrorCode;
}

/**
 * Complete message-to-priority mapping using existing ERROR_PRIORITIES
 * 
 * This mapping provides downstream processing for express-validator errors,
 * replacing the failed Object.defineProperty approach with clean message-based
 * priority determination in the formatter layer.
 * 
 * **Priority Mappings:**
 * - MISSING_ALL (5): All date fields empty - highest priority
 * - MISSING_FIELD (10): Individual field missing - high priority  
 * - FORMAT_ERROR (15): Invalid format/range - medium priority
 * - BUSINESS_RULE (20): Invalid date logic - medium priority
 * - FUTURE_DATE (25): Date in future - lower priority
 * - PAST_DATE (30): Unchanged value - lowest priority
 */
export const MESSAGE_PRIORITY_MAP: Record<DateValidationMessage, ValidationMessageMetadata> = {
  [DATE_VALIDATION_MESSAGES.ALL_MISSING]: { 
    priority: ERROR_PRIORITIES.MISSING_ALL, 
    isGlobal: true,
    code: ERROR_CODES.MISSING_REQUIRED
  },
  [DATE_VALIDATION_MESSAGES.DAY_MISSING]: { 
    priority: ERROR_PRIORITIES.MISSING_FIELD, 
    isGlobal: false,
    code: ERROR_CODES.MISSING_REQUIRED
  },
  [DATE_VALIDATION_MESSAGES.MONTH_MISSING]: { 
    priority: ERROR_PRIORITIES.MISSING_FIELD, 
    isGlobal: false,
    code: ERROR_CODES.MISSING_REQUIRED
  },
  [DATE_VALIDATION_MESSAGES.YEAR_MISSING]: { 
    priority: ERROR_PRIORITIES.MISSING_FIELD, 
    isGlobal: false,
    code: ERROR_CODES.MISSING_REQUIRED
  },
  [DATE_VALIDATION_MESSAGES.INVALID_DATE]: { 
    priority: ERROR_PRIORITIES.BUSINESS_RULE, 
    isGlobal: true,
    code: ERROR_CODES.INVALID_DATE
  },
  [DATE_VALIDATION_MESSAGES.FUTURE_DATE]: { 
    priority: ERROR_PRIORITIES.FUTURE_DATE, 
    isGlobal: true,
    code: ERROR_CODES.FUTURE_DATE
  },
  [DATE_VALIDATION_MESSAGES.UNCHANGED]: { 
    priority: ERROR_PRIORITIES.PAST_DATE, 
    isGlobal: true,
    code: ERROR_CODES.BUSINESS_RULE
  },
  [DATE_VALIDATION_MESSAGES.DAY_FORMAT]: { 
    priority: ERROR_PRIORITIES.FORMAT_ERROR, 
    isGlobal: false,
    code: ERROR_CODES.FORMAT_ERROR
  },
  [DATE_VALIDATION_MESSAGES.MONTH_FORMAT]: { 
    priority: ERROR_PRIORITIES.FORMAT_ERROR, 
    isGlobal: false,
    code: ERROR_CODES.FORMAT_ERROR
  },
  [DATE_VALIDATION_MESSAGES.YEAR_FORMAT]: { 
    priority: ERROR_PRIORITIES.FORMAT_ERROR, 
    isGlobal: false,
    code: ERROR_CODES.FORMAT_ERROR
  }
} as const;

/**
 * Compile-time validation of mapping completeness using TypeScript's satisfies operator
 * 
 * This elegant TypeScript solution ensures that MESSAGE_PRIORITY_MAP contains
 * entries for all messages in DATE_VALIDATION_MESSAGES without requiring
 * any unsafe type assertions or runtime overhead.
 * 
 * The satisfies operator (TypeScript 4.9+) provides compile-time validation
 * while preserving the exact type of MESSAGE_PRIORITY_MAP.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Compile-time validation only
const _validateMappingCompleteness = MESSAGE_PRIORITY_MAP satisfies Record<DateValidationMessage, ValidationMessageMetadata>;

// Type-level verification that all DATE_VALIDATION_MESSAGES are mapped
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Type-level validation only
type _CompileTimeValidation = {
  [K in DateValidationMessage]: K extends keyof typeof MESSAGE_PRIORITY_MAP ? true : never;
}[DateValidationMessage];

/**
 * Type guard for runtime validation of known validation messages
 * 
 * Provides safe type narrowing for validation messages, enabling
 * compile-time type safety when accessing message metadata.
 * 
 * @param {string} message - The message string to validate
 * @returns {message is DateValidationMessage} True if message is a known validation message
 * 
 * @example
 * ```typescript
 * if (isKnownValidationMessage(error.msg)) {
 *   // error.msg is now typed as DateValidationMessage
 *   const metadata = MESSAGE_PRIORITY_MAP[error.msg];
 * }
 * ```
 */
export function isKnownValidationMessage(message: string): message is DateValidationMessage {
  return message in MESSAGE_PRIORITY_MAP;
}

/**
 * Type-safe metadata getter with fallback for unknown messages
 * 
 * Provides safe access to message metadata with automatic fallback
 * to sensible defaults for unknown messages, ensuring the system
 * continues to function even with unexpected error messages.
 * 
 * @param {string} message - The validation message to get metadata for
 * @returns {ValidationMessageMetadata} Metadata for the message or safe defaults
 * 
 * @example
 * ```typescript
 * const metadata = getMessageMetadata(error.msg);
 * // Always returns valid metadata, even for unknown messages
 * console.log(`Priority: ${metadata.priority}, Global: ${metadata.isGlobal}`);
 * ```
 */
export function getMessageMetadata(message: string): ValidationMessageMetadata {
  if (isKnownValidationMessage(message)) {
    return MESSAGE_PRIORITY_MAP[message];
  }
  
  // Type-safe fallback with proper types for unknown messages
  return {
    priority: ERROR_PRIORITIES.FORMAT_ERROR,
    isGlobal: false,
    code: undefined
  } as const;
}

/**
 * Utility function to get all known validation messages
 * 
 * Provides access to the complete list of validation messages
 * for testing, documentation, or debugging purposes.
 * 
 * @returns {readonly DateValidationMessage[]} Array of all known validation messages
 */
export function getAllValidationMessages(): readonly DateValidationMessage[] {
  return Object.values(DATE_VALIDATION_MESSAGES);
}

/**
 * Utility function to get validation messages by priority level
 * 
 * Enables filtering of validation messages by their priority level,
 * useful for testing priority-based error handling logic.
 * 
 * @param {ErrorPriority} priority - The priority level to filter by
 * @returns {readonly DateValidationMessage[]} Array of messages with the specified priority
 */
export function getMessagesByPriority(priority: ErrorPriority): readonly DateValidationMessage[] {
  return getAllValidationMessages().filter(message => 
    MESSAGE_PRIORITY_MAP[message].priority === priority
  );
}

/**
 * Utility function to get global vs field-specific validation messages
 * 
 * Enables separation of global errors (affecting all fields) from
 * field-specific errors, useful for field highlighting logic.
 * 
 * @param {boolean} isGlobal - Whether to get global (true) or field-specific (false) messages
 * @returns {readonly DateValidationMessage[]} Array of messages matching the scope
 */
export function getMessagesByScope(isGlobal: boolean): readonly DateValidationMessage[] {
  return getAllValidationMessages().filter(message => 
    MESSAGE_PRIORITY_MAP[message].isGlobal === isGlobal
  );
}
