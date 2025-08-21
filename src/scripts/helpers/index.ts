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
  capitaliseFirst,
  safeBodyString,
  extractFormFields,
  safeApiField,
  extractCurrentFields
} from './dataTransformers.js';

// Date formatting utilities
export {
  formatDate,
  dateStringFromThreeFields
} from './dateFormatter.js';

// Date validation utilities
export {
  isRequestBodyWithDates,
  parseDateString,
  extractDateFormData,
  extractOriginalDateData,
  extractAndConvertDateFields,
  handleDateOfBirthValidationErrors
} from './ValidationDateHelpers.js';

// Form validation utilities
export {
  validateForm
} from './validateForm.js';

// Form controller helpers
export {
  handleGetEditForm,
  handlePostEditForm
} from './formControllerHelpers.js';

// Temporarily disabled locale exports to isolate CI issue
// export {
//   createLocaleLoader,
//   getLocaleLoader,
//   getDefaultLocaleLoader,
//   getText,
//   hasText,
//   clearLocaleCache,
//   loadLocaleData,
//   t,
//   type ExpressLocaleLoader,
//   type LocaleData,
//   type LocaleLoader
// } from './localeLoader.js';

// // Locale type definitions
// export {
//   type LocaleStructure
// } from './localeTypes.js';

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

export {
  createChangeDetectionValidator,
  TypedValidationError,
  formatValidationError,
  handleValidationErrors,
} from './ValidationErrorHelpers.js'
