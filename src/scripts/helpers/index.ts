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
  booleanToString,
  isRecord,
  safeStringFromRecord,
  hasProperty,
  capitaliseFirst,
  safeBodyString,
  extractFormFields,
  safeApiField,
  safeNestedField,
  extractCurrentFields,
  normaliseSelectedCheckbox,
  type FieldConfig
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

// Form controller helpers
export {
  handleGetEditForm,
  handlePostEditForm,
  handleAddThirdPartyValidationErrors,
  handleEditThirdPartyValidationErrors,
  prepareThirdPartyData,
  handleAddClientSupportNeedsErrors,
  prepareClientSupportNeedsData
} from './formControllerHelpers.js';

// Session helpers
export {
  storeSessionData,
  getSessionData,
  clearSessionData,
  clearAllOriginalFormData,
  storeOriginalFormData
} from './sessionHelpers.js';

export {
  initializeI18nextSync,
  i18next,
  t,
  nunjucksT,
  type ExpressLocaleLoader
} from './i18nLoader.js';

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
  createSessionChangeDetectionValidator,
  TypedValidationError,
  formatValidationError,
  handleValidationErrors,
} from './ValidationErrorHelpers.js'
