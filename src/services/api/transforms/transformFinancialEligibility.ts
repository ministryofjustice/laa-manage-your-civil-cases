import type { FinancialEligibilityData, PropertySetData } from '#types/api-types.js';
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

  const benefits = isRecord(item.specific_benefits) ? item.specific_benefits : {};

  const specificBenefits = {
    pensionCredit: Boolean(benefits.pension_credit),
    jobSeekers: Boolean(benefits.job_seekers_allowance),
    employmentSupport: Boolean(benefits.employment_support),
    universalCredit: Boolean(benefits.universal_credit),
    incomeSupport: Boolean(benefits.income_support),
  };

  const propertySet: PropertySetData[] = Array.isArray(item.property_set)
    ? item.property_set.map((property) => ({
      value: Number(property.value),
      mortgageLeft: Number(property.mortgage_left),
      share: Number(property.share),
      disputed: Boolean(property.disputed),
      main: Boolean(property.main),
    }))
    : [];

  return {
    hasPartner,
    isUnder17,
    isOver60,
    specificBenefits,
    propertySet
  };
}