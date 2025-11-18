/**
 * Transform Logs
 * Transforms raw CLA API log entries to display format
 */

import type { LogEntry } from '#types/api-types.js';
import { safeString, isRecord } from '#src/scripts/helpers/index.js';

/**
 * Transform raw log entry to LogEntry type
 * @param {unknown} item Raw log entry item from API
 * @returns {LogEntry} Transformed log entry
 */
export function transformLogEntry(item: unknown): LogEntry {
  if (!isRecord(item)) {
    throw new Error('Invalid log entry: expected object');
  }

  return {
    code: safeString(item.code),
    created_by: safeString(item.created_by),
    created: safeString(item.created),
    notes: item.notes ? safeString(item.notes) : null,
    type: safeString(item.type) as 'outcome' | 'system' | 'event',
    level: safeString(item.level) as 'HIGH' | 'MODERATE' | 'MINOR',
    timer: typeof item.timer === 'number' ? item.timer : null,
    patch: isRecord(item.patch) ? item.patch : null
  };
}

/**
 * Transform array of raw log entries
 * @param {unknown} items Raw log entries array from API
 * @returns {LogEntry[]} Array of transformed log entries
 */
export function transformLogEntries(items: unknown): LogEntry[] {
  if (!Array.isArray(items)) {
    throw new Error('Invalid log entries: expected array');
  }

  return items.map(transformLogEntry);
}

/**
 * Find the most recent log entry matching a specific code
 * @param {LogEntry[]} logs Array of log entries
 * @param {string} code Event code to search for (e.g., 'MIS-OOS', 'CLSP')
 * @returns {LogEntry | null} Most recent matching log entry or null
 */
export function findMostRecentLogByCode(logs: LogEntry[], code: string): LogEntry | null {
  if (!logs || logs.length === 0) {
    return null;
  }

  // Logs are already ordered newest first from API
  return logs.find(log => log.code === code) || null;
}

/**
 * Extract notes from outcome logs for banner display
 * Looks for notes in closure/rejection outcome codes
 * @param {LogEntry[]} logs Array of log entries
 * @param {string[]} outcomeCodes Array of outcome codes to check (e.g., ['MIS-OOS', 'MIS-MEANS', 'COI'])
 * @returns {string | null} Notes from the most recent matching log or null
 */
export function extractOutcomeNotes(logs: LogEntry[], outcomeCodes: string[]): string | null {
  if (!logs || logs.length === 0 || !outcomeCodes || outcomeCodes.length === 0) {
    return null;
  }

  // Find the first log entry matching any of the outcome codes
  for (const log of logs) {
    if (outcomeCodes.includes(log.code) && log.notes) {
      return log.notes;
    }
  }

  return null;
}
