/**
 * Helpers Index
 *
 * Central export point for all helper utilities.
 * This allows for cleaner imports throughout the application.
 *
 * Usage:
 * import { devLog, safeString, formatDate } from '#src/scripts/helpers';
 */

// Development logging utilities
export {
  devLog,
  devWarn,
  devError,
  devDebug,
  isDevelopment
} from './devLogger.js';

// Data transformation utilities
export {
  isValidDateOfBirth,
  safeString,
  safeOptionalString,
  isRecord
} from './dataTransformers.js';

// Date formatting utilities
export {
  formatDate
} from './dateFormatter.js';
