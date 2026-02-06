/**
 * API Services Index
 * Central export point for all API services
 */

// Export individual services
// Import all services for creating the combined apiService object
import { getCases, searchCases } from './resources/casesApiService.js';
import { getClientDetails, updateClientDetails, getClientHistoryDetails, updateProviderNotes } from './resources/clientDetailsApiService.js';
import {
  addThirdPartyContact,
  updateThirdPartyContact,
  deleteThirdPartyContact
} from './resources/thirdPartyApiService.js';
import {
  addClientSupportNeeds,
  updateClientSupportNeeds,
  deleteClientSupportNeeds
} from './resources/supportNeedsApiService.js';
import { getFeedbackChoices, submitOperatorFeedback } from './resources/operatorFeedbackApiService.js';

export * from './resources/casesApiService.js';
export * from './resources/clientDetailsApiService.js';
export * from './resources/thirdPartyApiService.js';
export * from './resources/supportNeedsApiService.js';
export * from './resources/operatorFeedbackApiService.js';

/**
 * Combined API Service object for backward compatibility
 * Maintains the same interface as the original ApiService class
 */
export const apiService = {
  getCases,
  searchCases,
  getClientDetails,
  updateClientDetails,
  updateProviderNotes,
  addThirdPartyContact,
  updateThirdPartyContact,
  deleteThirdPartyContact,
  addClientSupportNeeds,
  updateClientSupportNeeds,
  deleteClientSupportNeeds,
  getClientHistoryDetails,
  getFeedbackChoices,
  submitOperatorFeedback
};
