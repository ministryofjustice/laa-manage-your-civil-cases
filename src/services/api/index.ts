/**
 * API Services Index
 * Central export point for all API services
 */

// Export individual services
// Import all services for creating the combined apiService object
import { getCases, searchCases } from './casesApiService.js';
import { getClientDetails, updateClientDetails } from './clientDetailsApiService.js';
import {
  addThirdPartyContact,
  updateThirdPartyContact,
  deleteThirdPartyContact
} from './thirdPartyApiService.js';
import {
  addClientSupportNeeds,
  updateClientSupportNeeds,
  deleteClientSupportNeeds
} from './supportNeedsApiService.js';
import { getCaseLogs } from './logsApiService.js';

export * from './casesApiService.js';
export * from './clientDetailsApiService.js';
export * from './thirdPartyApiService.js';
export * from './supportNeedsApiService.js';
export * from './logsApiService.js';

/**
 * Combined API Service object for backward compatibility
 * Maintains the same interface as the original ApiService class
 */
export const apiService = {
  getCases,
  searchCases,
  getClientDetails,
  updateClientDetails,
  addThirdPartyContact,
  updateThirdPartyContact,
  deleteThirdPartyContact,
  addClientSupportNeeds,
  updateClientSupportNeeds,
  deleteClientSupportNeeds,
  getCaseLogs
};
