import { IncomeData, SavingsData, DeductionData } from "#types/api-types.js";
/**
 * Shared types for MSW handlers
 */

export interface MockCase {
  fullName: string;
  caseReference: string;
  providerId: string;
  refCode: string;
  dateReceived: string;
  lastModified?: string;
  dateClosed?: string;
  caseStatus: string;
  provider_closed?: string;
  stateNote?: string;
  isUrgent?: string;
  client_notes?: string;
  operatorNotes?: string;
  category: string;
  dateOfBirth: string;
  language: string;
  phoneNumber: string;
  safeToCall: boolean;
  announceCall: boolean;
  emailAddress: string;
  address: string;
  postcode: string;
  laaReference: string;
  outcomeCode: string;
  vulnerableUser?: boolean;
  thirdParty?: {
    fullName: string;
    emailAddress: string;
    contactNumber: string;
    safeToCall: boolean;
    address: string;
    postcode: string;
    relationshipToClient: {
      selected: string[];
    };
    passphraseSetUp: {
      selected: string[];
      passphrase?: string;
    };
  } | null;
  scopeTraversal?: {
    category?: string;
    subCategory?: string;
    onwardQuestion?: Array<{
      question: string;
      answer: string;
    }>;
    financialAssessmentStatus?: string;
    created?: string;
  }
  diagnosis?: {
    category?: string;
    diagnosisNode?: Array<{ node: string; }>;
  }
  notesHistory?: Array<{
    createdBy?: string;
    created?: string;
    providerNotes?: string;
  }>;
  clientSupportNeeds?: {
    bslWebcam?: string;
    textRelay?: string;
    skype?: boolean;
    minicom?: boolean;
    callbackPreference?: string;
    languageSupportNeeds?: string;
    notes?: string;
  };
  financialEligibility?: {
    hasPartner?: boolean;
    isUnder17?: boolean;
    isOver60?: boolean;

    specificBenefits?: {
      pensionCredit: boolean;
      jobSeekers: boolean;
      employmentSupport: boolean;
      universalCredit: boolean;
      incomeSupport: boolean;
    }
    propertySet: Array<{
      value: number;
      mortgageLeft: number;
      id: number;
      share: number;
      disputed: boolean;
      main: boolean;
    }>
    clientData?: {
      income: IncomeData,
      savings: SavingsData,
      deductions: DeductionData
    }
    partnerData?: {
      partnerIncome: IncomeData,
      partnerSavings: SavingsData,
      partnerDeductions: DeductionData
    }
    disregards?: {
      vaccine_damage: boolean,
      national_emergencies: boolean,
      vcjd_trust: boolean,
      infected_blood: boolean,
      child_maintenance: boolean,
      benefit_payments: boolean,
      child_abuse: boolean,
      grenfell_tower: boolean,
      london_emergencies: boolean,
      justice_compensation: boolean,
      love_manchester: boolean,
      overseas_terrorism: boolean,
      energy_prices: boolean,
      criminal_injuries: boolean,
      modern_slavery: boolean,
      cost_living: boolean
    };
    dependantsYoung: number;
    dependantsOld: number;
  }
}
