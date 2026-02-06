/**
 * Data Transformation Helpers
 *
 * Utility functions for safely transforming and validating data from JSON fixtures
 */

import type { FieldConfig } from '#types/form-controller-types.js';
import type { PaginationResult } from '#types/pagination-types.js';
import { formatDate, formatLongFormDate } from './dateFormatter.js';
/**
 * Safely extract nested field value using custom path resolution
 * @param {unknown} obj - Object to traverse
 * @param {string} path - Dot-separated path (e.g., 'thirdParty.fullName')
 * @returns {unknown} Field value or undefined if path doesn't exist
 */
export function safeNestedField(obj: unknown, path: string): unknown {
  if (!isRecord(obj)) return undefined;

  const segments = path.split('.');

  return segments.reduce<unknown>((current, segment) => {
    if (!isRecord(current) || !hasProperty(current, segment)) {
      return undefined;
    }
    const { [segment]: value } = current;
    return value;
  }, obj);
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
 * Helper function to convert boolean to string for radio buttons
 * @param {unknown} value - Boolean value from API
 * @returns {string} String representation for form ('true', 'false', or '')
 */
export function booleanToString(value: unknown): string {
  if (typeof value === 'boolean') {
    return value.toString();
  }
  // Handle string boolean values as fallback
  if (value === 'true' || value === 'false') {
    return safeString(value);
  }
  return '';
}

/**
 * Type guard to check if value is a record object
 * @param {unknown} value Value to check
 * @returns {boolean} True if value is a record object
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Safely extract a string value from a record object
 * @param {unknown} obj - Object to extract from
 * @param {string} key - Key to extract
 * @returns {string | null} String value or null if not found/not string
 */
export function safeStringFromRecord(obj: unknown, key: string): string | null {
  if (!isRecord(obj) || !(key in obj)) {
    return null;
  }

  const { [key]: value } = obj;
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

/**
 * Check if an object has a specific property (type guard)
 * @param {unknown} obj - Object to check
 * @param {string} key - Key to check for
 * @returns {boolean} True if object has the property
 */
export function hasProperty(obj: unknown, key: string): obj is Record<string, unknown> {
  return isRecord(obj) && key in obj;
}

/**
 * Capitalise the first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string} String with first letter capitalized
 */
export function capitaliseFirst(str: string): string {
  const FIRST_CHAR_INDEX = 0;
  const REST_CHARS_START = 1;

  if (str === '' || str.length === FIRST_CHAR_INDEX) {
    return '';
  }
  return str.charAt(FIRST_CHAR_INDEX).toUpperCase() + str.slice(REST_CHARS_START);
}

/**
 * Capitalises the first character of the provided string and lowercases the rest.
 * If the input is an empty string, the function returns an empty string.
 * @param {string} str - The string to transform.
 * @returns {string} The transformed string with the first character in upper case and the remainder in lower case.
 */
export const capitaliseFirstLetter = (str: string): string => {
  const EMPTY_STRING_LENGTH = 0;
  const FIRST_CHAR_INDEX = 0;
  const REST_OF_STRING_START = 1;

  if (str.length === EMPTY_STRING_LENGTH) return '';
  return str.charAt(FIRST_CHAR_INDEX).toUpperCase() + str.slice(REST_OF_STRING_START).toLowerCase();
};

/**
 * Safely extract and trim a string value from request body
 * @param {unknown} body - Request body object
 * @param {string} key - Key to extract
 * @returns {string} Trimmed string value or empty string if not found
 */
export function safeBodyString(body: unknown, key: string): unknown {
  return hasProperty(body, key) ? body[key] : '';
}

/**
 * Extract multiple form field values from request body
 * @param {unknown} body - Request body object
 * @param {string[]} keys - Array of keys to extract
 * @returns {Record<string, unknown>} Object with extracted and trimmed string values
 */
export function extractFormFields(body: unknown, keys: string[]): Record<string, unknown> {
  return keys.reduce<Record<string, unknown>>((acc, key) => {
    acc[key] = safeBodyString(body, key);
    return acc;
  }, {});
}

/**
 * Normalises a form field value by trimming whitespace and converting empty strings to undefined
 * @param {string} raw - The input filed to transform
 * @returns {string | undefined} The trimmed string, or undefined if empty or not a string.
 */
export function trimOrUndefined(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  return trimmed === '' ? undefined : trimmed;
}

/**
 * Check if the value matches the expected type
 * @param {unknown} value - Value to check
 * @param {'string' | 'boolean' | 'number' | 'array'} expectedType - Expected type
 * @returns {boolean} True if type matches
 */
function isTypeValid(value: unknown, expectedType: 'string' | 'boolean' | 'number' | 'array'): boolean {
  switch (expectedType) {
    case 'string':
      return typeof value === 'string';
    case 'boolean':
      return typeof value === 'boolean';
    case 'number':
      return typeof value === 'number';
    case 'array':
      return Array.isArray(value);
  }
}

/**
 * Safely extract a field value from API data with optional type checking
 * Supports both simple field names and nested paths (e.g., 'user.profile.name' or 'items.0.title')
 * @param {unknown} data - API response data
 * @param {string} fieldName - Name or path of the field to extract
 * @param {'string' | 'boolean' | 'number' | 'array'} [expectedType] - Expected type of the field (optional)
 * @returns {string} Safe string value or empty string
 */
export function safeApiField(data: unknown, fieldName: string, expectedType?: 'string' | 'boolean' | 'number' | 'array'): unknown {
  const value: unknown = safeNestedField(data, fieldName);

  // If expectedType is specified, check the type
  if (expectedType !== undefined && !isTypeValid(value, expectedType)) {
    return expectedType === 'array' ? [] : '';
  }
  return value;
}

/**
 * Extract field value using either path or field name
 * @param {unknown} data - API response data
 * @param {FieldConfig} config - Field configuration
 * @returns {string} Safe string value
 */
function getFieldValue(data: unknown, config: FieldConfig): unknown {
  const { field, path, type } = config;
  const fieldPath = path ?? field;
  return safeApiField(data, fieldPath, type);
}

/**
 * Get original value for keepOriginal functionality
 * @param {unknown} data - API response data
 * @param {FieldConfig} config - Field configuration
 * @returns {unknown} Original value or undefined
 */
function getOriginalValue(data: unknown, config: FieldConfig): unknown {
  const { field, path } = config;
  const fieldPath = path ?? field;
  return safeNestedField(data, fieldPath);
}

/**
 * Extract current field values for form rendering from API data
 * Supports both flat structures (legacy) and nested structures via lodash paths
 * @param {unknown} data - API response data
 * @param {FieldConfig[]} fieldConfigs - Field configurations
 * @returns {Record<string, unknown>} Object with current field values
 */
export function extractCurrentFields(
  data: unknown,
  fieldConfigs: FieldConfig[]
): Record<string, unknown> {
  return fieldConfigs.reduce<Record<string, unknown>>((formData, config) => {
    const { field, currentName, keepOriginal = false, includeExisting = false } = config;

    // Extract field value
    const fieldValue = getFieldValue(data, config);

    // Set current field value
    const currentKey = currentName ?? `current${capitaliseFirst(field)}`;
    formData[currentKey] = fieldValue;

    // Create existing field if requested (for forms that need change detection)
    if (includeExisting) {
      const existingKey = `existing${capitaliseFirst(field)}`;
      formData[existingKey] = fieldValue;
    }

    // Keep original value if requested (for complex types like boolean)
    if (keepOriginal) {
      const originalValue: unknown = getOriginalValue(data, config);
      if (originalValue !== undefined) {
        formData[field] = originalValue;
      }
    }

    return formData;
  }, {});
}

/**
 * Normalises the input into an array of strings
 * Accepts a string, an array of strings, or anything else (ignored)
 * @param {unknown} value - The value of to normalise
 * @returns {string[]} - Returns an array of strings
 */
export function normaliseSelectedCheckbox(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((x): x is string => typeof x === 'string');
  if (typeof value === 'string' && value.trim() !== '') return [value];
  return [];
}

/**
 * Normalise truthy "Yes"/"No"/boolean/strings
 * @param {unknown} value - Value of 
 * @returns {boolean} - true or false if it meets comparison
 */
export const isYes = (value: unknown): boolean => {
  const selection = safeString(value).trim().toLowerCase();
  if (selection === 'yes' || selection === 'true') return true;
  if (selection === 'no' || selection === 'false') return false;
  // fall back: treat non-empty as truthy
  return Boolean(selection);
};

/**
 * Extract phone number with mobile priority fallback to home phone
 * This is defensive - we expect phone number to be in mobile_phone but
 * we're not assuming that historical data will always comply.
 * @param {unknown} personalDetails - Object containing mobile_phone and home_phone fields
 * @returns {string} The mobile phone if available, otherwise home phone, otherwise empty string
 */
export const extractPhoneNumber = (personalDetails: unknown): string => {
  if (!isRecord(personalDetails)) return '';

  const mobilePhone = safeOptionalString(personalDetails.mobile_phone);
  const homePhone = safeOptionalString(personalDetails.home_phone);

  return (mobilePhone ?? homePhone) ?? '';
};

/**
 * Extract safe to call boolean from personal details
 * Empty string or 'SAFE' value means it's safe to call (verified from API behavior)
 * @param {unknown} personalDetails - Object containing safe_to_contact field
 * @returns {boolean} True if safe to call, false otherwise
 */
export const isSafeToCall = (personalDetails: unknown): boolean => {
  if (!isRecord(personalDetails)) return false;

  const safeToContactValue = safeOptionalString(personalDetails.safe_to_contact);
  return safeToContactValue === '' || safeToContactValue === 'SAFE';
};

/**
 * Transform contact details from personal_details
 * @param {unknown} personalDetails - Personal details from API
 * @returns {object} Transformed contact details
 */
export const transformContactDetails = (personalDetails: unknown): {
  fullName: string;
  dateOfBirth: string;
  phoneNumber: string;
  safeToCall: boolean;
  announceCall: boolean;
  emailAddress: string;
  address: string;
  postcode: string;
} => {
  if (!isRecord(personalDetails)) {
    throw new Error('Invalid API response: missing personal_details');
  }

  const fullName = safeString(personalDetails.full_name);
  const dateOfBirth = formatDate(safeString(personalDetails.date_of_birth));
  const phoneNumber = extractPhoneNumber(personalDetails);
  const safeToCall = isSafeToCall(personalDetails);
  const announceCall = Boolean(personalDetails.announce_call);
  const emailAddress = safeOptionalString(personalDetails.email) ?? '';
  const address = safeOptionalString(personalDetails.street) ?? '';
  let postcode = safeOptionalString(personalDetails.postcode) ?? '';
  postcode = postcode.toUpperCase();

  return {
    fullName,
    dateOfBirth,
    phoneNumber,
    safeToCall,
    announceCall,
    emailAddress,
    address,
    postcode
  };
};

/**
 * Transform client support needs from adaptation_details
 * @param {unknown} adaptationDetails - Adaptation details from API
 * @returns {object | null} Transformed support needs or null if not present
 */
export const transformClientSupportNeeds = (adaptationDetails: unknown): {
  skype: boolean;
  bslWebcam: string;
  textRelay: string;
  callbackPreference: string;
  languageSupportNeeds: string;
  notes: string;
  no_adaptations_required: boolean;
} | null => {
  if (!isRecord(adaptationDetails)) {
    return null;
  }

  return {
    skype: adaptationDetails.skype_webcam === true,
    bslWebcam: adaptationDetails.bsl_webcam === true ? 'Yes' : 'No',
    textRelay: adaptationDetails.text_relay === true ? 'Yes' : 'No',
    callbackPreference: adaptationDetails.callback_preference === true ? 'Yes' : 'No',
    languageSupportNeeds: safeOptionalString(adaptationDetails.language) ?? '',
    notes: safeOptionalString(adaptationDetails.notes) ?? '',
    no_adaptations_required: adaptationDetails.no_adaptations_required === true
  };
};

/**
 * Extract email address from personal details, defaulting to empty string
 * @param {unknown} personalDetails - Personal details object
 * @returns {string} Email address or empty string
 */
const extractEmailAddress = (personalDetails: unknown): string => {
  if (!isRecord(personalDetails)) return '';
  return safeOptionalString(personalDetails.email) ?? '';
};

/**
 * Extract street address from personal details, defaulting to empty string
 * @param {unknown} personalDetails - Personal details object
 * @returns {string} Street address or empty string
 */
const extractStreetAddress = (personalDetails: unknown): string => {
  if (!isRecord(personalDetails)) return '';
  return safeOptionalString(personalDetails.street) ?? '';
};

/**
 * Extract and uppercase postcode from personal details
 * @param {unknown} personalDetails - Personal details object
 * @returns {string} Uppercased postcode or empty string
 */
const extractPostcode = (personalDetails: unknown): string => {
  if (!isRecord(personalDetails)) return '';
  return (safeOptionalString(personalDetails.postcode) ?? '').toUpperCase();
};

/**
 * Extract relationship to client, defaulting to empty string
 * @param {unknown} thirdpartyDetails - Third party details object
 * @returns {string} Relationship to client or empty string
 */
const extractRelationshipToClient = (thirdpartyDetails: unknown): string => {
  if (!isRecord(thirdpartyDetails)) return '';
  return safeOptionalString(thirdpartyDetails.personal_relationship) ?? '';
};

/**
 * Extract no contact reason, defaulting to empty string
 * @param {unknown} thirdpartyDetails - Third party details object
 * @returns {string} No contact reason or empty string
 */
const extractNoContactReason = (thirdpartyDetails: unknown): string => {
  if (!isRecord(thirdpartyDetails)) return '';
  return safeOptionalString(thirdpartyDetails.reason) ?? '';
};

/**
 * Extract passphrase, defaulting to empty string
 * @param {unknown} thirdpartyDetails - Third party details object
 * @returns {string} Passphrase or empty string
 */
const extractPassphrase = (thirdpartyDetails: unknown): string => {
  if (!isRecord(thirdpartyDetails)) return '';
  return safeOptionalString(thirdpartyDetails.pass_phrase) ?? '';
};

/**
 * Transform raw third party details from API to display format.
 * Includes soft-delete detection for records with relationshipToClient='OTHER' and empty fullName.
 * @param {unknown} thirdpartyDetails - Raw third party details from API
 * @returns {object | null} Transformed third party contact object with isSoftDeleted flag, or null if invalid
 */
export const transformThirdParty = (thirdpartyDetails: unknown): {
  fullName: string;
  contactNumber: string;
  safeToCall: boolean;
  emailAddress: string;
  address: string;
  postcode: string;
  relationshipToClient: string;
  noContactReason: string;
  passphrase: string;
  isSoftDeleted: boolean;
} | null => {
  if (!isRecord(thirdpartyDetails)) {
    return null;
  }

  const { personal_details: tpPersonal } = thirdpartyDetails;

  if (!isRecord(tpPersonal)) {
    return null;
  }

  const fullName = safeOptionalString(tpPersonal.full_name) ?? '';
  const relationshipToClient = extractRelationshipToClient(thirdpartyDetails);

  // Detect if this is a soft-deleted third party
  // Soft-deleted records have relationshipToClient === 'OTHER' and empty fullName
  const isSoftDeleted = relationshipToClient === 'OTHER' && fullName === '';

  return {
    fullName,
    contactNumber: extractPhoneNumber(tpPersonal),
    safeToCall: isSafeToCall(tpPersonal),
    emailAddress: extractEmailAddress(tpPersonal),
    address: extractStreetAddress(tpPersonal),
    postcode: extractPostcode(tpPersonal),
    relationshipToClient,
    noContactReason: extractNoContactReason(thirdpartyDetails),
    passphrase: extractPassphrase(thirdpartyDetails),
    isSoftDeleted
  };
};

/**
 * Detects if a third party record is soft-deleted
 * A soft-deleted third party has relationshipToClient === 'OTHER' and no fullName
 * This indicates the record exists in the database but has been cleared
 * @param {unknown} thirdParty - Third party object to check
 * @returns {boolean} True if third party is soft-deleted, false otherwise
 */
export function isSoftDeletedThirdParty(thirdParty: unknown): boolean {
  if (!isRecord(thirdParty)) {
    return false;
  }

  const relationshipToClient = safeString(thirdParty.relationshipToClient);
  const fullName = safeString(thirdParty.fullName);

  return relationshipToClient === 'OTHER' && fullName === '';
}

/**
 * Transform raw scope traversal details from API to display format.
 * @param {unknown} scopeTraversal - Raw scope traversal details from API
 * @returns {object | null} Transformed scope traversal object
 */
export const transformScopeTraversal = (scopeTraversal: unknown): {
  category: string;
  subCategory: string;
  onwardQuestion: Array<{
    question: string;
    answer: string;
  }>;
  financialAssessmentStatus: string;
  created: string;
} | null => {
  if (!isRecord(scopeTraversal)) {
    return null;
  }

  const { scope_answers: sAnswersAndQuestions } = scopeTraversal;

  if (!Array.isArray(sAnswersAndQuestions)) {
    return null;
  }

  const { category, subCategory, onwardQuestion } = sAnswersAndQuestions
    .filter(isRecord)
    .reduce<{
      category: string; subCategory: string; onwardQuestion: Array<{ question: string; answer: string }>;
    }>((result, obj) => {
      const type = safeStringFromRecord(obj, 'type');

      if (type === 'category') {
        result.category = safeOptionalString(obj.answer) ?? '';
      } else if (type === 'sub_category') {
        result.subCategory = safeOptionalString(obj.answer) ?? '';
      } else if (type === 'onward_question') {
        const question = safeStringFromRecord(obj, 'question') ?? '';
        const answer = safeStringFromRecord(obj, 'answer') ?? '';
        if (question || answer) {
          result.onwardQuestion.push({ question, answer });
        }
      }

      return result;
    }, {
      category: '',
      subCategory: '',
      onwardQuestion: []
    });

  return {
    category,
    subCategory,
    onwardQuestion,
    financialAssessmentStatus: safeOptionalString(scopeTraversal.financial_assessment_status) ?? '',
    created: formatLongFormDate(safeOptionalString(scopeTraversal.created) ?? '')
  };
};

/**
 * Transform raw diagnosis details from API to display format.
 * @param {unknown} diagnosis - Raw diagnosis from API
 * @returns {object | null} Transformed diagnosis object
 */
export const transformDiagnosis = (diagnosis: unknown): {
  category: string;
  diagnosisNode: Array<{ node: string; }>;
} | null => {
  if (!isRecord(diagnosis) || !Array.isArray(diagnosis.nodes)) {
    return null;
  }

  const nodeFilterList = [
    "INSCOPE",
    "The client has been discriminated against, or they've been treated badly because they complained about discrimination or supported someone else’s discrimination claim\n\nIt is against the law to discriminate against anyone because of:\n\n* age\n* gender reassignment\n* being married or in a civil partnership\n* being pregnant or having recently given birth\n* disability\n* race including colour, nationality, ethnic or national origin\n* religion, belief or lack of religion or belief\n* sex\n* sexual orientation",
    "Describe scenario carefully in notes - client's circumstances and why they believe they are facing eviction or have been evicted. *Then click 'next' to continue*",
    "Describe scenario carefully in notes - including the client's circumstances and why they believe they are facing eviction or have been evicted"
  ]

  const diagnosisNode = diagnosis.nodes.filter(isRecord)
    .map(obj => safeStringFromRecord(obj, "key") ?? "")
    .filter((node): node is string => Boolean(node) && !nodeFilterList.includes(node))
    .map(node => ({ node }));

  return {
    category: safeOptionalString(diagnosis.category) ?? '',
    diagnosisNode
  };
};

/**
 * Transform raw notes history from API to display format.
 * @param {unknown} notesHistory - Raw notes history from API
 * @returns {Array} Array of transformed notes history objects
 */
export const transformNotesHistory = (
  notesHistory: unknown
): Array<{
  createdBy: string;
  created: string;
  providerNotes: string;
}> => {

  const notesHistoryArray = Array.isArray(notesHistory)
    ? notesHistory
    : hasProperty(notesHistory, 'notes_history') && Array.isArray(notesHistory.notes_history)
      ? notesHistory.notes_history
      : [];

  return notesHistoryArray
    .filter(isRecord)
    .filter((item) => {
      // Only include items that have provider_notes
      const notes = safeOptionalString(item.provider_notes);
      return notes !== undefined && notes !== null && notes.trim() !== '';
    })
    .map((item) => ({
      createdBy: safeOptionalString(item.created_by) ?? '',
      created: formatLongFormDate(safeOptionalString(item.created) ?? ''),
      providerNotes: safeOptionalString(item.provider_notes) ?? ''
    }));
};

/**
 * Build ordering parameter based on `ordering` query string
 * @param {string} ordering - Query string for ordering (e.g., 'modified' or '-modified').
 * @param {string} sortBy - Default field to sort by.
 * @param {string} sortOrder - Default sort order ('asc' or 'desc').
 * @returns {{ sortBy: string; sortOrder: string }} Object containing the sort field and sort order.
 */
export function buildOrderingParamFields(ordering: string, sortBy: string, sortOrder: string): { sortBy: string; sortOrder: string } {
  let sortByParam = sortBy;
  let sortOrderParam = sortOrder;
  if (ordering !== '') {
    if (ordering.startsWith('-')) {
      const PREFIX_LENGTH = 1;
      sortByParam = ordering.substring(PREFIX_LENGTH);
      sortOrderParam = 'desc';
    } else {
      sortByParam = ordering;
      sortOrderParam = 'asc';
    }
  }
  return { sortBy: sortByParam, sortOrder: sortOrderParam };
}

/**
 * Create pagination for a given dataset
 * @template T
 * @param {T[]} items The full dataset to paginate
 * @param {unknown} pageQuery The raw page query value from the request (e.g. req.query.page)
 * @param {string} basePath  The root path used to construct pagination links
 * @param {number} PAGE_SIZE  The number of items per page
 * @returns {PaginationResult<T>} Pagination results and metadata
 */
export function createPaginationForGivenDataSet<T>(items: T[], pageQuery: unknown, basePath: string, PAGE_SIZE: number): PaginationResult<T> {
  const FIRST_PAGE = 1;

  // Parse page number safely
  const rawPage = Number(safeString(pageQuery ?? FIRST_PAGE));
  const page = Number.isFinite(rawPage) && rawPage >= FIRST_PAGE ? rawPage : FIRST_PAGE;

  const { length: totalItems } = items;
  const totalPages = Math.max(FIRST_PAGE, Math.ceil(totalItems / PAGE_SIZE));

  // Put viewable page into valid range
  const currentPage = Math.min(page, totalPages);

  // Slice items
  const start = (currentPage - FIRST_PAGE) * PAGE_SIZE;
  const end = start + PAGE_SIZE;

  // Build pagination items array
  const paginationItems = [];
  for (let pageNumber = FIRST_PAGE; pageNumber <= totalPages; pageNumber += FIRST_PAGE) {
    paginationItems.push({
      number: pageNumber,
      href: `${basePath}?page=${pageNumber}`,
      current: pageNumber === currentPage
    });
  }

  // Build previous link
  const previous = currentPage > FIRST_PAGE ? { href: `${basePath}?page=${currentPage - FIRST_PAGE}` } : null;

  // Build next link
  const next = currentPage < totalPages ? { href: `${basePath}?page=${currentPage + FIRST_PAGE}` } : null;

  return {
    slicedItems: items.slice(start, end),
    paginationMeta: {
      page: currentPage,
      pageSize: PAGE_SIZE,
      totalItems,
      totalPages,
      items: paginationItems,
      previous,
      next
    },
  };
}

