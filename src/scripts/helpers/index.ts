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
  safeString,
  safeOptionalString,
  isRecord,
  safeStringFromRecord,
  hasProperty,
  capitaliseFirst
} from './dataTransformers.js';

// Date formatting utilities
export {
  formatDate
} from './dateFormatter.js';

// Form validation utilities
export {
  validateForm
} from './validateForm.js';

// Form controller helpers
export {
  handleGetEditForm,
  handlePostEditForm
} from './formControllerHelpers.js';

// Error handling utilities
export {
  extractErrorMessage,
  isHttpError,
  isAuthError,
  isForbiddenError,
  isNotFoundError,
  isServerError,
  createProcessedError,
  extractAndLogError,
} from './errorHandler.js';
