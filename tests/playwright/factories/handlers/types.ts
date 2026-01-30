/**
 * Shared types for MSW handlers
 */

export interface MockCase {
  fullName: string;
  caseReference: string;
  refCode: string;
  dateReceived: string;
  lastModified?: string;
  dateClosed?: string;
  caseStatus: string;
  provider_closed?: string;
  stateNote?: string;
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
  clientSupportNeeds?: {
    bslWebcam?: string;
    textRelay?: string;
    skype: boolean;
    callbackPreference?: string;
    languageSupportNeeds?: string;
    notes?: string;
  };
}
