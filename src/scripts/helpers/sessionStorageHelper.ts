import type { Request } from 'express';
import { safeString, isRecord, hasProperty } from '#src/scripts/helpers/dataTransformers.js';

/**
 * Helper functions for session storage operations
 */

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
