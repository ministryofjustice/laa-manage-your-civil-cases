import type { FinancialEligibilityData } from '#types/api-types.js';
import { isRecord } from '#src/scripts/helpers/index.js';
import { transformFinancialEligibilityItem, convertPenceToPounds } from '../transforms/transformFinancialEligibility.js';

/**
 * Transforms raw legal help extract API data to display format
 * @param {unknown} item Raw legal help extract item
 * @returns {FinancialEligibilityData} Transformed legal help extract item
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

  const eligibilityData = transformFinancialEligibilityItem(eligibilityCheck);

  const personalDetails = isRecord(item.personal_details) ? item.personal_details : {};
  const nationalInsurance = String(personalDetails.ni_number ?? '');
  const asylumSupport = Boolean(item.on_nass_benefits);
  const calculations = isRecord(item.calculations) ? item.calculations : {};

  const mappedCalculations = {
    partnerEmploymentAllowance: convertPenceToPounds(Number(calculations.partner_employment_allowance ?? 0)),
    propertyCapital: convertPenceToPounds(Number(calculations.property_capital ?? 0)),
    pensionerDisregard: convertPenceToPounds(Number(calculations.pensioner_disregard ?? 0)),
    grossIncome: convertPenceToPounds(Number(calculations.gross_income ?? 0)),
    partnerAllowance: convertPenceToPounds(Number(calculations.partner_allowance ?? 0)),
    disposableIncome: convertPenceToPounds(Number(calculations.disposable_income ?? 0)),
    nonPropertyCapital: convertPenceToPounds(Number(calculations.non_property_capital ?? 0)),
    dependantsAllowance: convertPenceToPounds(Number(calculations.dependants_allowance ?? 0)),
    disposableCapitalAssets: convertPenceToPounds(Number(calculations.disposable_capital_assets ?? 0)),
    propertyEquities: Array.isArray(calculations.property_equities) ? calculations.property_equities.map((value: unknown) => convertPenceToPounds(Number(value ?? 0))) : [],
    employmentAllowance: convertPenceToPounds(Number(calculations.employment_allowance ?? 0)),
  };

  return {
    ...eligibilityData,
    nationalInsurance,
    asylumSupport,
    calculations: mappedCalculations,
  };
}