import type { FinancialEligibilityData, PropertySetData, SavingsData, IncomeData, DeductionData } from '#types/api-types.js';
import { isRecord, t } from '#src/scripts/helpers/index.js';

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
  const clientData = isRecord(item.you) ? item.you : {};
  const partnerData = isRecord(item.partner) ? item.partner : {};
  const income = formatIncomeData(clientData.income);
  const savings = formatSavingsData(clientData.savings);
  const deductions = formatDeductionsData(clientData.deductions);
  const partnerIncome = formatIncomeData(partnerData.income);
  const partnerSavings = formatSavingsData(partnerData.savings);
  const partnerDeductions = formatDeductionsData(partnerData.deductions);
  const depedantsYoung = Number(item.dependants_young ?? 0);
  const depedantsOld = Number(item.dependants_old ?? 0);
  const disregards = isRecord(item.disregards) ? Object.entries(item.disregards).filter(([, value]) => Boolean(value)).map(([key]) => t(`common.financialDisregards.${key}`)) : [];
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
    })) : [];

  return {
    hasPartner,
    isUnder17,
    isOver60,
    specificBenefits,
    propertySet,
    clientData: { income, savings, deductions },
    partnerData: { partnerIncome, partnerSavings, partnerDeductions },
    disregards,
    depedantsYoung,
    depedantsOld
  };
}

/**
 * Function to format interval value 
 * @param value number value to be formatted as a string with an interval period applied.
 * @returns a string with an number and interval period applied
 */
function formatIntervalValue(value: unknown): string {
  console.log("formatting value", value)
  if (!isRecord(value)) {
    return String(value ?? '');
  }
  return `${convertPenceToPounds(Number(value.per_interval_value ?? 0))} ${t(`common.intervalPeriod.${value.interval_period}`)}`;
}

/**
 * Function to format savings data
 * @param savings savings data to be formatted
 * @returns formatted savings data
 */
function formatSavingsData(savings: unknown): SavingsData {
  if (!isRecord(savings)) {
    return {} as SavingsData;
  }

  console.log("transforming savings data: ", savings)
  return {
    bankBalance: convertPenceToPounds(Number(savings.bank_balance ?? 0)),
    investmentBalance: convertPenceToPounds(Number(savings.investment_balance ?? 0)),
    assetBalance: convertPenceToPounds(Number(savings.asset_balance ?? 0)),
    creditBalance: convertPenceToPounds(Number(savings.credit_balance ?? 0)),
    total: convertPenceToPounds(Number(savings.total ?? 0)),
  };
}

/**
 * Function to format deductions data
 * @param deductions deductions data to be formatted
 * @returns formatted deductions data
 */
function formatDeductionsData(deductions: unknown): DeductionData {
  if (!isRecord(deductions)) {
    return {} as DeductionData;
  }
  return {
    incomeTax: formatIntervalValue(deductions.income_tax),
    nationalInsurance: formatIntervalValue(deductions.national_insurance),
    maintenance: formatIntervalValue(deductions.maintenance),
    childcare: formatIntervalValue(deductions.childcare),
    mortgage: formatIntervalValue(deductions.mortgage),
    rent: formatIntervalValue(deductions.rent),
    criminalContributions: `${convertPenceToPounds(Number(deductions.criminal_legalaid_contributions ?? 0))} per month`,
    total: convertPenceToPounds(Number(deductions.total ?? 0)),
  };
}

/**
 * Function to format income data
 * @param income income data to be formatted
 * @returns formatted income data
 */
function formatIncomeData(income: unknown): IncomeData {
  if (!isRecord(income)) {
    return {} as IncomeData;
  }
  return {
    earnings: formatIntervalValue(income.earnings),
    selfEmploymentDrawings: formatIntervalValue(income.self_employment_drawings),
    benefits: formatIntervalValue(income.benefits),
    taxCredits: formatIntervalValue(income.tax_credits),
    childBenefit: formatIntervalValue(income.child_benefits),
    maintenanceReceived: formatIntervalValue(income.maintenance_received),
    pension: formatIntervalValue(income.pension),
    otherIncome: formatIntervalValue(income.other_income),
    selfEmployed: Boolean(income.self_employed),
    total: convertPenceToPounds(Number(income.total ?? 0)),
  };
}

/**
 * Function to convert pence to pounds
 * @param pence amount in pence to be converted to pounds
 * @returns pounds amount as a number
 */
function convertPenceToPounds(pence: number): number {
  return pence / 100;
}