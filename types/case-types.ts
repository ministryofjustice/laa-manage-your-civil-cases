/**
 * Case-related type definitions
 *
 * Shared interfaces for case data across the application
 */


/**
 * Case data structure for display and client-side operations
 */
export interface CaseData {
  fullName: string;
  laaReference: string;
  caseReference: string;
  refCode: string;
  provider_assigned_at: string;
  provider_viewed?: string;
  provider_accepted?: string;
  outcome_code?: string; 
  caseStatus: string;
  dateOfBirth: string;
  modified?: string;
  provider_closed?: string;
  // Client contact details
  phoneNumber?: string;
  safeToCall?: boolean;
  announceCall?: boolean;
  emailAddress?: string;
  // Client information
  clientIsVulnerable?: boolean;
  address?: string;
  postcode?: string;
  specialNotes?: string;
  outcomeDescription?: string;
}

/**
 * Options for loading case data
 */
export interface CaseLoadOptions {
  caseType: 'new' | 'accepted' | 'opened' | 'closed';
  sortOrder: 'asc' | 'desc';
}

/**
 * Case status types
 */
export type CaseStatus = 'New' | 'Accepted' | 'Opened' | 'Closed';

/**
 * Case status label types
 */
export type CaseStatusLabels = 'new' | 'pending' | 'advising' | 'closed' | 'completed';

/**
 * Case reference code types
 */
export type CaseRefCode = '' | 'Manually allocated by operator' | 'Operator recommends second opinion' | 'Out of scope for CLA' | 'Duplicate of existing case' | 'Not financially eligible for CLA' | 'Split from another case';

export interface EligibilityIntervalAmount {
  per_interval_value: number;
  interval_period: string;
}

export interface EligibilityIncome {
  earnings: EligibilityIntervalAmount | null;
  self_employment_drawings: EligibilityIntervalAmount | null;
  benefits: EligibilityIntervalAmount | null;
  tax_credits: EligibilityIntervalAmount | null;
  child_benefits?: EligibilityIntervalAmount | null;
  maintenance_received: EligibilityIntervalAmount | null;
  pension: EligibilityIntervalAmount | null;
  other_income: EligibilityIntervalAmount | null;
  self_employed: boolean;
  total: number;
}

export interface EligibilitySavings {
  bank_balance: number;
  investment_balance: number;
  asset_balance: number;
  credit_balance: number;
  total: number;
}

export interface EligibilityDeductions {
  income_tax: EligibilityIntervalAmount;
  national_insurance: EligibilityIntervalAmount;
  maintenance: EligibilityIntervalAmount;
  childcare: EligibilityIntervalAmount;
  mortgage: EligibilityIntervalAmount;
  rent: EligibilityIntervalAmount;
  criminal_legalaid_contributions: number;
  total: number;
}

export interface EligibilityPerson {
  income: EligibilityIncome;
  savings: EligibilitySavings;
  deductions: EligibilityDeductions;
}

export interface EligibilitySpecificBenefits {
  pension_credit: boolean;
  job_seekers_allowance: boolean;
  employment_support: boolean;
  universal_credit: boolean;
  income_support: boolean;
}

export interface EligibilityDisregards {
  vaccine_damage: boolean;
  national_emergencies: boolean;
  overseas_terrorism: boolean;
  infected_blood: boolean;
  child_maintenance: boolean;
  benefit_payments: boolean;
  child_abuse: boolean;
  grenfell_tower: boolean;
  london_emergencies: boolean;
  justice_compensation: boolean;
  love_manchester: boolean;
  vcjd_trust: boolean;
  energy_prices: boolean;
  criminal_injuries: boolean;
  modern_slavery: boolean;
  cost_living: boolean;
}

export interface EligibilityCheck {
  reference: string;
  category: string;
  your_problem_notes: string;
  notes: string;
  property_set: unknown[];
  you: EligibilityPerson;
  partner: EligibilityPerson;
  disputed_savings: EligibilitySavings;
  dependants_young: number;
  dependants_old: number;
  is_you_or_your_partner_over_60: boolean;
  has_partner: boolean | null;
  on_passported_benefits: boolean;
  on_nass_benefits: boolean;
  state: string;
  specific_benefits: EligibilitySpecificBenefits;
  disregards: EligibilityDisregards;
  has_passported_proceedings_letter: boolean;
  under_18_passported: boolean;
  is_you_under_18: boolean;
  under_18_receive_regular_payment: boolean;
  under_18_has_valuables: boolean;
}
