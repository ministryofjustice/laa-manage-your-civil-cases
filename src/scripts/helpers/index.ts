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
  toBoolean,
  toNumber,
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
  normaliseSelectedKeys,
  isYes,
  toYesNo,
  capitaliseFirstLetter,
  extractPhoneNumber,
  isSafeToCall,
  transformContactDetails,
  transformStateNote,
  transformClientSupportNeeds,
  transformThirdParty,
  transformScopeTraversal,
  transformDiagnosis,
  transformNotesHistory,
  buildOrderingParamFields,
  isSoftDeletedThirdParty,
  trimOrUndefined,
  formatFinancialData
} from './dataTransformers.js';

// Date formatting utilities
export {
  formatDate,
  formatDateLongMonth,
  formatLongFormDate,
  formatLongFormDateWithShortMonth,
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
  prepareClientSupportNeedsData,
  handleEditClientSupportNeedsErrors,
  validCaseReference,
  hasCaseStatus, 
  hasAllowedCaseStatus, 
  handleNoChangeRedirect
} from './formControllerHelpers.js';

// Session helpers
export {
  storeSessionData,
  getSessionData,
  clearSessionData,
  clearAllOriginalFormData,
  storeOriginalFormData,
  getSessionValue,
  setSessionValue,
  getSessionString,
  deleteSessionKeys
} from './sessionHelpers.js';

export {
  initializeI18nextSync,
  i18next,
  t,
  nunjucksT,
  type ExpressLocaleLoader
} from './i18nLoader.js';

// Legal help form shared option definitions
export {
  LEGAL_HELP_FORM_CIRCUMSTANCE_OPTIONS,
  LEGAL_HELP_FORM_CIRCUMSTANCE_VALUES,
  type LegalHelpFormCircumstanceOption
} from './legalHelpFormOptions.js';

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

// Validation helpers
export {
  createChangeDetectionValidator,
  createSessionChangeDetectionValidator,
  TypedValidationError,
  formatValidationError,
  handleValidationErrors,
} from './ValidationErrorHelpers.js'

// Helper to fetch provider name and details
export {
  fetchProviderNameAndDetail,
  hasMoreThanOneCategory
} from './providerDetailHelper.js';

export {
  handleRelay
} from './auth.js';