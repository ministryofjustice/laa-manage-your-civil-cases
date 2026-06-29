import type { FinancialEligibilityData } from '#types/api-types.js';
import { isRecord } from '#src/scripts/helpers/index.js';


/**
 * Transforms raw financial eligibility API data to display format
 * @param {unknown} item Raw financial eligibility item
 * @returns {FinancialEligibilityData} Transformed financial eligibility item
 */
export function transformFinancialEligilibilityItem(item: unknown): FinancialEligibilityData {
    if (!isRecord(item)) {
        throw new Error('Invalid financial eligibility item: expected object');
    }

    const isUnder17 = Boolean(item.is_you_under_18);
    const isOver60 = Boolean(item.is_you_or_your_partner_over_60);
    const hasPartner = Boolean(item.has_partner);

    return {
        hasPartner,
        isUnder17,
        isOver60
    };        
}