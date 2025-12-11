/**
 * Transform Client History Details
 * Transforms raw CLA API client history details to display format
 */

import type {ClientHistoryLogItem} from '#types/api-types.js';
import {
  safeString,
  safeOptionalString,
  isRecord,
  formatLongFormDate
} from '#src/scripts/helpers/index.js';

/**
 * Transform raw client history logs to display format
 * @param {unknown} item Raw client details item
 * @returns {ClientHistoryLogItem} Transformed client history details
 */
export function transformClientHistoryLogs(item: unknown): ClientHistoryLogItem {
  if (!isRecord(item)) {
    throw new Error('Invalid client history details item: expected object');
  }

  const code = safeString(item.code);
  const createdBy = safeString(item.created_by);
  const createdDateString = safeString(item.created);
  const created = formatLongFormDate(createdDateString);
  const notes = safeOptionalString(item.notes) ?? '';

  return {
    code,
    createdBy,
    created,
    notes
  };
}

/**
 * Transform client history log to timeline item format for MOJ Timeline component
 * @param {ClientHistoryLogItem} log Client history log item
 * @param {Function} t Translation function
 * @returns {object} Timeline item for MOJ Timeline component
 */
export function transformHistoryLogToTimelineItem(
  log: ClientHistoryLogItem,
  t: (key: string, options?: Record<string, unknown>) => string
): {
  label: { text: string };
  text: string;
  datetime: { timestamp: string; type: string };
  byline: { text: string };
} {
  const outcomeDescription = log.code !== '' ? t(`common.outcomeCode.${log.code}`) : '';

  return {
    label: {
      text: outcomeDescription
    },
    text: log.notes,
    datetime: {
      timestamp: log.created,
      type: 'datetime'
    },
    byline: {
      text: log.createdBy
    }
  };
}
