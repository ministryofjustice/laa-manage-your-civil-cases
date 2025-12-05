/**
 * Transform Client History Details
 * Transforms raw CLA API client history details to display format
 */

import type { ClientHistoryLogItem } from '#types/api-types.js';
import {
  safeString,
  safeOptionalString,
  isRecord,
  formatLongFormDate
} from '#src/scripts/helpers/index.js';

/**
 * Transform raw client history logs to display format
 * @param {unknown} item Raw client details item
 * @returns {ClientHistoryLogItem} Transformed client details item
 */
export function transformClientHistoryLogs(item: unknown): ClientHistoryLogItem {
  if (!isRecord(item)) {
    throw new Error('Invalid client history details item: expected object');
  }

  const code = safeString(item.code);
  const createdBy = safeString(item.created_by);
  const created = formatLongFormDate(safeString(item.created));
  const notes = safeOptionalString(item.notes) ?? '';

  return {
    code,
    createdBy,
    created,
    notes
  };
}
