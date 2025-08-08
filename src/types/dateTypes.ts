/**
 * Shared date-related types for validation and controller logic
 * 
 * This module provides common type definitions used across both validation
 * helpers and controller helpers to ensure consistency and reduce duplication.
 * 
 * @version 1.0.0
 * @since 2025-08-07
 */

/**
 * Basic date fields interface for validation
 */
export interface DateFields {
  day: string;
  month: string;
  year: string;
}

/**
 * Extended date fields interface for controller form handling
 * Includes original values for change detection
 */
export interface ExtendedDateFields extends DateFields {
  originalDay: string;
  originalMonth: string;
  originalYear: string;
}

/**
 * Date validation result interface
 */
export interface DateValidationResult {
  isValid: boolean;
  isRealDate: boolean;
  isNotFuture: boolean;
  isChanged: boolean;
}
