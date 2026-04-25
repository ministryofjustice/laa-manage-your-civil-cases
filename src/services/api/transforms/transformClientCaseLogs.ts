/**
 * Transform Client Case Log Details
 * Transforms raw CLA API client case log details to display format
 */

import type { CaseLogItem } from '#types/api-types.js';
import {
  safeString,
  safeOptionalString,
  isRecord,
  formatLongFormDate
} from '#src/scripts/helpers/index.js';

/**
 * Transform raw client case logs to display format
 * @param {unknown} item Raw client details item
 * @returns {CaseLogItem} Transformed client details item
 */
export function transformClientCaseLogs(item: unknown): CaseLogItem {
  if (!isRecord(item)) {
    throw new Error('Invalid client case log item: expected object');
  }

  const code = safeString(item.code);
  const createdBy = safeString(item.created_by);
  const created = formatLongFormDate(safeString(item.created));
  const createdIso = safeString(item.created);
  const notes = safeOptionalString(item.notes) ?? '';

  return {
    code,
    createdBy,
    created,
    createdIso,
    notes
  };
}
