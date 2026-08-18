import type { ClientDiversityDataItem } from '#types/api-types.js';
import { isRecord } from '#src/scripts/helpers/index.js';

/**
 * Transforms client diversity API data to display format
 * @param {unknown} item Raw diversity data item
 * @returns {ClientDiversityDataItem} Transformed diversity data item
 */
export function transformClientDiversityDataItem(item: unknown): ClientDiversityDataItem {
  if (!isRecord(item)) {
    throw new Error('Invalid client diversity data item: expected object');
  }

  const gender = item.gender == null ? '' : String(item.gender);
  const disability = item.disability == null ? '' : String(item.disability);
  const ethnicity = item.ethnicity == null ? '' : String(item.ethnicity);

  return {
    gender,
    disability,
    ethnicity
  };
}