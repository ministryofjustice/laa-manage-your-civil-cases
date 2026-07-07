import type { FinancialEligibilityData, PropertySetData, SavingsData, IncomeData, DeductionData, MoneyPerInterval } from '#types/api-types.js';
import { isRecord, t } from '#src/scripts/helpers/index.js';

/**
 * Transforms raw financial eligibility API data to display format
 * @param {unknown} item Raw financial eligibility item
 * @returns {FinancialEligibilityData} Transformed financial eligibility item
 */
export function transformFinancialEligibilityItem(item: unknown): FinancialEligibilityData {
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
      value: convertPenceToPounds(Number(property.value)),
      mortgageLeft: convertPenceToPounds(Number(property.mortgage_left)),
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
 * Function to format savings data
 * @param {unknown} savings savings data to be formatted
 * @returns {SavingsData} formatted savings data
 */
function formatSavingsData(savings: unknown): SavingsData {
  if (!isRecord(savings)) {
    return {} as SavingsData;
  }
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
 * @param {unknown} deductions deductions data to be formatted
 * @returns {DeductionData} formatted deductions data
 */
function formatDeductionsData(deductions: unknown): DeductionData {
  if (!isRecord(deductions)) {
    return {} as DeductionData;
  }
  return {
    incomeTax: formatMoneyPerInterval(deductions.income_tax),
    nationalInsurance: formatMoneyPerInterval(deductions.national_insurance),
    maintenance: formatMoneyPerInterval(deductions.maintenance),
    childcare: formatMoneyPerInterval(deductions.childcare),
    mortgage: formatMoneyPerInterval(deductions.mortgage),
    rent: formatMoneyPerInterval(deductions.rent),
    criminalContributions: {amount: convertPenceToPounds(Number(deductions.criminal_legalaid_contributions ?? 0)),time: 'per_month'},
    total: convertPenceToPounds(Number(deductions.total ?? 0)),
  };
}

/**
 * Function to format income data
 * @param {unknown} income income data to be formatted
 * @returns {IncomeData} formatted income data
 */
function formatIncomeData(income: unknown): IncomeData {
  if (!isRecord(income)) {
    return {} as IncomeData;
  }
  return {
    earnings: formatMoneyPerInterval(income.earnings),
    selfEmploymentDrawings: formatMoneyPerInterval(income.self_employment_drawings),
    benefits: formatMoneyPerInterval(income.benefits),
    taxCredits: formatMoneyPerInterval(income.tax_credits),
    childBenefit: formatMoneyPerInterval(income.child_benefits),
    maintenanceReceived: formatMoneyPerInterval(income.maintenance_received),
    pension: formatMoneyPerInterval(income.pension),
    otherIncome: formatMoneyPerInterval(income.other_income),
    selfEmployed: Boolean(income.self_employed),
    total: convertPenceToPounds(Number(income.total ?? 0)),
  };
}

/**
 * Function to format data using money per interval interface
 * @param { unknown } value value to be formatted
 * @returns { MoneyPerInterval } a money per interval object with a value and time interval 
 */
function formatMoneyPerInterval(value: unknown): MoneyPerInterval {
  if (!isRecord(value)) {
    return {
      amount: 0,
      time: 'per_month'
    };
  }

  return {
    amount: convertPenceToPounds(Number(value.per_interval_value ?? 0)),
    time: value.interval_period as MoneyPerInterval['time']
  };
}

/**
 * Function to convert pence to pounds
 * @param {number} pence amount in pence to be converted to pounds
 * @returns {number} pounds amount as a number
 */
function convertPenceToPounds(pence: number): number {
  return pence / 100;
}