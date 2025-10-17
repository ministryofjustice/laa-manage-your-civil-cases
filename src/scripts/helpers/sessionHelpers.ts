import type { Request } from 'express';
import type { AuthCredentials, UserInfo } from '#types/auth-types.js';
import { safeString, isRecord, hasProperty } from '#src/scripts/helpers/dataTransformers.js';

// Session token storage interface
export interface SessionTokenStorage {
  accessToken: string;
  username: string;
  loginTime: number;
}

// Extend the Express session interface to support dynamic namespaces
declare module 'express-session' {
  interface SessionData extends Record<string, Record<string, string> | string | undefined> {
    // This allows both specific properties and dynamic namespace access
    authCredentials?: AuthCredentials;
    authTokens?: SessionTokenStorage;
    user?: UserInfo;
  }
}

/**
 * Store a hash of key-value pairs in the session under a specific namespace
 * @param {Request} req Express request with session
 * @param {string} namespace Session key to store data under (e.g., 'thirdPartyOriginal')
 * @param {Record<string, string>} data Hash of key-value pairs where values are strings
 */
export function storeSessionData(req: Request, namespace: string, data: Record<string, string>): void {
  // Store our typed data directly in the session
  req.session[namespace] = data;
}

/**
 * Retrieve a hash of key-value pairs from the session
 * @param {Request} req Express request with session
 * @param {string} namespace Session key to retrieve data from
 * @returns {Record<string, string> | null} Hash of key-value pairs or null if not found
 */
export function getSessionData(req: Request, namespace: string): Record<string, string> | null {
  const { session } = req;
  const { [namespace]: data } = session;
  // Return the data if it's a Record, otherwise null for undefined or string
  return (typeof data === 'object') ? data : null;
}

/**
 * Clear data from the session
 * @param {Request} req Express request with session
 * @param {string} namespace Session key to clear
 */
export function clearSessionData(req: Request, namespace: string): void {
  req.session[namespace] = undefined;
}

/**
 * Clear all session data for form original values
 * Removes any session keys that contain 'Original' in the name
 * @param {Request} req Express request with session
 */
export function clearAllOriginalFormData(req: Request): void {
  // Get all session keys and filter for ones containing 'Original'
  const sessionKeys = Object.keys(req.session);
  const originalDataKeys = sessionKeys.filter(key => key.includes('Original'));
  
  // Clear each original form data key
  originalDataKeys.forEach(key => {
    req.session[key] = undefined;
  });
}

/**
 * Store form pre-population data in session for later comparison
 * Converts form field values to string format and stores under specified namespace
 * @param {Request} req Express request with session
 * @param {string} namespace Session key to store data under (e.g., 'thirdPartyOriginal')
 * @param {Record<string, unknown>} formData Form field values used for pre-population
 */
export function storeOriginalFormData(req: Request, namespace: string, formData: Record<string, unknown>): void {
  // Convert all form values to strings for consistent comparison
  const stringifiedData: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(formData)) {
    // Convert all values to strings, handling null/undefined as empty string
    stringifiedData[key] = value?.toString() ?? '';
  }
  
  storeSessionData(req, namespace, stringifiedData);
}

/**
 * Get a value from session storage
 * @param {Request} req - Express request object
 * @param {string} key - The session key to retrieve
 * @returns {unknown} The value from session or undefined if not found
 */
export function getSessionValue(req: Request, key: string): unknown {
  if (!isRecord(req.session) || !hasProperty(req.session, key)) {
    return undefined;
  }
  return req.session[key];
}

/**
 * Get a string value from session storage with safe conversion
 * @param {Request} req - Express request object
 * @param {string} key - The session key to retrieve
 * @returns {string} The string value or empty string if not found
 */
export function getSessionString(req: Request, key: string): string {
  const value = getSessionValue(req, key);
  return safeString(value);
}

/**
 * Set a value in session storage
 * @param {Request} req - Express request object
 * @param {string} key - The session key to set
 * @param {unknown} value - The value to store
 */
export function setSessionValue(req: Request, key: string, value: unknown): void {
  if (!isRecord(req.session)) {
    return;
  }
  (req.session as Record<string, unknown>)[key] = value;
}

/**
 * Delete specific keys from session
 * @param {Request} req - Express request object
 * @param {string[]} keys - The session keys to delete
 */
export function deleteSessionKeys(req: Request, keys: string[]): void {
  if (!isRecord(req.session)) {
    return;
  }
  const session = req.session as Record<string, unknown>;
  keys.forEach(key => {
    if (hasProperty(session, key)) {
      session[key] = undefined;
    }
  });
}