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
  dateOfBirth: string;
  clientIsVulnerable: boolean;
  language: string;
  phoneNumber: string;
  safeToCall: boolean;
  announceCall: boolean;
  emailAddress: string;
  address: string;
  postcode: string;
  laaReference: string;
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
  scopeTraversal?:{
    category?: string;
    subCategory?: string;
    onwardQuestion?: Array<{
      question: string;
      answer: string;
    }>;
    financialAssessmentStatus?: string;
    created?: string;
  }
  diagnosis?:{
    category?:string;
    diagnosisNode?: Array<{ node: string; }>;
  }
  notesHistory?:Array <{
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
}
