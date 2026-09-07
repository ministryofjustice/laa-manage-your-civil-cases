import type { FinancialEligibilityData, PropertySetData, SavingsData, IncomeData, DeductionData, MoneyPerInterval } from '#types/api-types.js';
import { isRecord, normaliseSelectedKeys } from '#src/scripts/helpers/index.js';
import { response } from '#node_modules/@types/express/index.js';
import { transformFinancialEligibilityItem } from '../transforms/transformFinancialEligibility.js';

/**
 * Transforms raw financial eligibility API data to display format
 * @param {unknown} item Raw financial eligibility item
 * @returns {FinancialEligibilityData} Transformed financial eligibility item
 */

export function transformLegalHelpFormItem(item: unknown,): FinancialEligibilityData {
  if (!isRecord(item)) {
    throw new Error('Invalid legal help extract: expected object',);
  }

  const eligibilityCheck = item.eligibility_check;

  if (!isRecord(eligibilityCheck)) {
    throw new Error(
      'Invalid legal help extract: expected eligibility_check object',
    );
  }

  const eligibilityData =transformFinancialEligibilityItem(eligibilityCheck);

  const personalDetails = isRecord(item.personal_details) ? item.personal_details : {};
  const nationalInsurance = String(personalDetails.ni_number ?? '');
  const asylumSupport = Boolean(item.on_nass_benefits);

  return {
    ...eligibilityData,
    nationalInsurance,
    asylumSupport,
  };
}