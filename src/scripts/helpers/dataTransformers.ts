/**
 * Data Transformation Helpers
 *
 * Utility functions for safely transforming and validating data from JSON fixtures
 */

import type { FieldConfig } from '#types/form-controller-types.js';
import { formatDate } from './dateFormatter.js';

/**
 * Decode HTML entities in a string
 * Handles common HTML entities that might be returned from the CLA API
 * @param {string} str - String with HTML entities
 * @returns {string} Decoded string
 */
function decodeHTMLEntities(str: string): string {
  // Constants for entity parsing
  const HEX_ENTITY_START = 3; // Length of '&#x' prefix
  const DECIMAL_ENTITY_START = 2; // Length of '&#' prefix
  const ENTITY_END_OFFSET = -1; // Offset to remove trailing ';'
  const HEX_RADIX = 16;
  const DECIMAL_RADIX = 10;

  // Map of common HTML entities
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&#x27;': "'",
    '&nbsp;': ' ',
  };

  // Replace named and numeric entities
  return str.replace(/&[a-z0-9]+;|&#[0-9]+;|&#x[0-9a-f]+;/gi, (match) => {
    // Check if it's in our map
    if (match in entities) {
      return entities[match];
    }
    
    // Handle numeric entities like &#39;
    if (match.startsWith('&#x')) {
      const code = parseInt(match.slice(HEX_ENTITY_START, ENTITY_END_OFFSET), HEX_RADIX);
      return String.fromCharCode(code);
    }
    if (match.startsWith('&#')) {
      const code = parseInt(match.slice(DECIMAL_ENTITY_START, ENTITY_END_OFFSET), DECIMAL_RADIX);
      return String.fromCharCode(code);
    }
    
    // Return as-is if we can't decode it
    return match;
  });
}

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
 * Decodes HTML entities that may be present in API responses
 * @param {unknown} value Value to convert
 * @returns {string} String value or empty string
 */
export function safeString(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return decodeHTMLEntities(value);
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return '';
}

/**
 * Safely get optional string value from unknown data
 * Decodes HTML entities that may be present in API responses
 * @param {unknown} value Value to convert
 * @returns {string | undefined} String value or undefined
 */
export function safeOptionalString(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === 'string') {
    return decodeHTMLEntities(value);
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
    bslWebcam: adaptationDetails.bsl_webcam === true ? 'Yes' : 'No',
    textRelay: adaptationDetails.text_relay === true ? 'Yes' : 'No',
    callbackPreference: adaptationDetails.callback_preference === true ? 'Yes' : 'No',
    languageSupportNeeds: safeOptionalString(adaptationDetails.language) ?? '',
    notes: safeOptionalString(adaptationDetails.notes) ?? '',
    no_adaptations_required: adaptationDetails.no_adaptations_required === true
  };
};

/**
 * Transform third party contact from thirdparty_details
 * @param {unknown} thirdpartyDetails - Third party details from API
 * @returns {object | null} Transformed third party or null if not present
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
} | null => {
  if (!isRecord(thirdpartyDetails)) {
    return null;
  }

  const { personal_details: tpPersonal } = thirdpartyDetails;

  if (!isRecord(tpPersonal)) {
    return null;
  }

  const tpContactNumber = extractPhoneNumber(tpPersonal);
  const tpSafeToCall = isSafeToCall(tpPersonal);

  let tpPostcode = safeOptionalString(tpPersonal.postcode) ?? '';
  tpPostcode = tpPostcode.toUpperCase();

  return {
    fullName: safeOptionalString(tpPersonal.full_name) ?? '',
    contactNumber: tpContactNumber,
    safeToCall: tpSafeToCall,
    emailAddress: safeOptionalString(tpPersonal.email) ?? '',
    address: safeOptionalString(tpPersonal.street) ?? '',
    postcode: tpPostcode,
    relationshipToClient: safeOptionalString(thirdpartyDetails.personal_relationship) ?? '',
    noContactReason: safeOptionalString(thirdpartyDetails.no_contact_reason) ?? '',
    passphrase: safeOptionalString(thirdpartyDetails.pass_phrase) ?? ''
  };
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
