/**
 * Data Transformation Helpers
 *
 * Utility functions for safely transforming and validating data from JSON fixtures
 */

import type { DateOfBirth } from '#types/case-types.js';

/**
 * Type guard to check if an object is a valid DateOfBirth
 * @param {unknown} value Value to check
 * @returns {boolean} True if value is a valid DateOfBirth object
 */
export function isValidDateOfBirth(value: unknown): value is DateOfBirth {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  // Safe access to object properties
  const hasDay = 'day' in value && typeof (value as { day: unknown }).day === 'string';
  const hasMonth = 'month' in value && typeof (value as { month: unknown }).month === 'string';
  const hasYear = 'year' in value && typeof (value as { year: unknown }).year === 'string';

  return hasDay && hasMonth && hasYear;
}

/**
 * Safely get string value from unknown data
 * @param {unknown} value Value to convert
 * @returns {string} String value or empty string
 */
export function safeString(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return '';
}

/**
 * Safely get optional string value from unknown data
 * @param {unknown} value Value to convert
 * @returns {string | undefined} String value or undefined
 */
export function safeOptionalString(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return undefined;
}

/**
 * Type guard to check if value is a record object
 * @param {unknown} value Value to check
 * @returns {boolean} True if value is a record object
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
