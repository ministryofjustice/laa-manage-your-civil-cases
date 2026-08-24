import type { ClientDiversityDataItem } from '#types/api-types.js';
import { isRecord, safeString } from '#src/scripts/helpers/index.js';

/**
 * Transforms client diversity API data to display format
 * @param {unknown} item Raw diversity data item
 * @returns {ClientDiversityDataItem} Transformed diversity data item
 */
export function transformClientDiversityDataItem(item: unknown): ClientDiversityDataItem {
  if (!isRecord(item)) {
    throw new Error('Invalid client diversity data item: expected object');
  }

  const gender = safeString(item.gender);
  const ethnicity = safeString(item.ethnicity);
  const disability = safeString(item.disability);

  return {
    gender,
    ethnicity,
    disability
  };
}