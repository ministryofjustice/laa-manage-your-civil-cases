/**
 * Data Transformation Helpers
 *
 * Utility functions for safely transforming and validating data from JSON fixtures
 */

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
 * Capitalize the first letter of a string
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
 * Safely extract and trim a string value from request body
 * @param {unknown} body - Request body object
 * @param {string} key - Key to extract
 * @returns {string} Trimmed string value or empty string if not found
 */
export function safeBodyString(body: unknown, key: string): string {
  return hasProperty(body, key) ? safeString(body[key]).trim() : '';
}

/**
 * Extract multiple form field values from request body
 * @param {unknown} body - Request body object
 * @param {string[]} keys - Array of keys to extract
 * @returns {Record<string, string>} Object with extracted and trimmed string values
 */
export function extractFormFields(body: unknown, keys: string[]): Record<string, string> {
  return keys.reduce<Record<string, string>>((acc, key) => {
    acc[key] = safeBodyString(body, key);
    return acc;
  }, {});
}

/**
 * Safely extract a field value from API data with optional type checking
 * @param {unknown} data - API response data
 * @param {string} fieldName - Name of the field to extract
 * @param {'string' | 'boolean' | 'number'} [expectedType] - Expected type of the field (optional)
 * @returns {string} Safe string value or empty string
 */
export function safeApiField(data: unknown, fieldName: string, expectedType?: 'string' | 'boolean' | 'number'): string {
  if (!isRecord(data) || !(fieldName in data)) {
    return '';
  }

  const { [fieldName]: value } = data;

  // If expectedType is specified, check the type
  if (expectedType !== undefined) {
    if (
      (expectedType === 'string' && typeof value !== 'string') ||
      (expectedType === 'boolean' && typeof value !== 'boolean') ||
      (expectedType === 'number' && typeof value !== 'number')
    ) {
      return '';
    }
  }

  return safeString(value);
}

/**
 * Extract current field values for form rendering from API data
 * @param {unknown} data - API response data
 * @param {Array<{field: string, type?: 'string' | 'boolean' | 'number', currentName?: string, keepOriginal?: boolean, includeExisting?: boolean}>} fieldConfigs - Field configurations
 * @returns {Record<string, unknown>} Object with current field values
 */
export function extractCurrentFields(
  data: unknown,
  fieldConfigs: Array<{ field: string; type?: 'string' | 'boolean' | 'number'; currentName?: string; keepOriginal?: boolean; includeExisting?: boolean }>
): Record<string, unknown> {
  return fieldConfigs.reduce<Record<string, unknown>>((acc, config) => {
    const { field, type, currentName, keepOriginal = false, includeExisting = false } = config;
    const fieldValue = safeApiField(data, field, type);

    // Set current field value
    const currentKey = currentName ?? `current${capitaliseFirst(field)}`;
    acc[currentKey] = fieldValue;

    // Create existing field if requested (for forms that need change detection)
    if (includeExisting) {
      const existingKey = `existing${capitaliseFirst(field)}`;
      acc[existingKey] = fieldValue;
    }

    // Keep original value if requested (for complex types like boolean)
    if (keepOriginal && isRecord(data) && hasProperty(data, field)) {
      const { [field]: originalValue } = data;
      acc[field] = originalValue;
    }

    return acc;
  }, {});
}
