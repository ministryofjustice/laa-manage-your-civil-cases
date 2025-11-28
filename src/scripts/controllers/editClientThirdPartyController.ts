import type { Request, Response, NextFunction } from 'express';
import 'csrf-sync'; // Import to ensure CSRF types are loaded
import { 
  handleGetEditForm, 
  extractFormFields, 
  handleEditThirdPartyValidationErrors, 
  prepareThirdPartyData, 
  devLog,
  devError, 
  createProcessedError, 
  safeString,
  isRecord,
  hasProperty,
  safeStringFromRecord,
  extractCurrentFields,
  storeOriginalFormData,
  clearSessionData,
  booleanToString,
  validCaseReference
} from '#src/scripts/helpers/index.js';
import { apiService } from '#src/services/apiService.js';

// HTTP Status codes
const INTERNAL_SERVER_ERROR = 500;

/**
 * Extracts and formats third-party client data from a record object
 * @param {Record<string, unknown>} thirdPartyData - The raw third-party data object
 * @returns {Record<string, unknown>} A formatted object containing third-party client details
 */
function extractThirdPartyData(thirdPartyData: Record<string, unknown>): Record<string, unknown> {
  return {
    thirdPartyFullName: safeStringFromRecord(thirdPartyData, 'fullName') ?? '',
    thirdPartyEmailAddress: safeStringFromRecord(thirdPartyData, 'emailAddress') ?? '',
    thirdPartyContactNumber: safeStringFromRecord(thirdPartyData, 'contactNumber') ?? '',
    thirdPartySafeToCall: booleanToString(thirdPartyData.safeToCall),
    thirdPartyAddress: safeStringFromRecord(thirdPartyData, 'address') ?? '',
    thirdPartyPostcode: safeStringFromRecord(thirdPartyData, 'postcode') ?? '',
    thirdPartyRelationshipToClient: safeStringFromRecord(thirdPartyData, 'relationshipToClient') ?? '',
    thirdPartyPassphraseSetUp: safeStringFromRecord(thirdPartyData, 'noContactReason') ?? '',
    thirdPartyPassphrase: safeStringFromRecord(thirdPartyData, 'passphrase') ?? '',
  };
}

/**
 * Returns configuration for third-party client fields used in the form
 * @returns {Array<{ field: string; type: 'string' }>} An array of field configuration objects
 */
function getFieldConfigs(): Array<{ field: string; type: 'string' }> {
  return [
    { field: 'thirdPartyFullName', type: 'string' },
    { field: 'thirdPartyEmailAddress', type: 'string' },
    { field: 'thirdPartyContactNumber', type: 'string' },
    { field: 'thirdPartySafeToCall', type: 'string' },
    { field: 'thirdPartyAddress', type: 'string' },
    { field: 'thirdPartyPostcode', type: 'string' },
    { field: 'thirdPartyRelationshipToClient', type: 'string' },
    { field: 'thirdPartyPassphraseSetUp', type: 'string' },
    { field: 'thirdPartyPassphrase', type: 'string' }
  ];
}

/**
 * Renders the edit client third party form for a given case reference.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export async function getEditClientThirdParty(req: Request, res: Response, next: NextFunction): Promise<void> {
  await handleGetEditForm(req, res, next, {
    templatePath: 'case_details/third_party_details/change-client-third-party.njk',
    /**
     * Transforms nested third party API data to flat structure for standard field extraction
     * Uses domain-specific helpers for readability while leveraging safeNestedField for robustness
     * @param {unknown} apiData - API response data containing nested third party object
     * @returns {Record<string, unknown>} Flattened data structure for standard field extraction
     */
    dataExtractor: (apiData: unknown): Record<string, unknown> => {
      // Early return if data structure is invalid
      if (!isRecord(apiData) || !hasProperty(apiData, 'thirdParty')) {
        return {};
      }

      const { thirdParty: thirdPartyData } = apiData;
      if (!isRecord(thirdPartyData)) {
        return {};
      }
      
      // Transform nested structure to flat structure using safe extractors
      const flatData = extractThirdPartyData(thirdPartyData);

      // Set thirdPartyPassphraseSetUp to `Yes` so that conditional reveal can show on form
      if (flatData.thirdPartyPassphrase !== '') {
        flatData.thirdPartyPassphraseSetUp = 'Yes';
      }

      // Store original form data in session for later comparison
      storeOriginalFormData(req, 'thirdPartyOriginal', flatData);

      // Use extractCurrentFields helper to generate current form data
      return extractCurrentFields(flatData, getFieldConfigs());
    }
  });
}

/**
 * Handles the submission of the edit third party form for a given case reference.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export async function postEditClientThirdParty(req: Request, res: Response, next: NextFunction): Promise<void> {
  const caseReference = safeString(req.params.caseReference);

  if (!validCaseReference(caseReference, res)) {
    return;
  }

  const formFields = extractFormFields(req.body, [
    'thirdPartyFullName', 
    'thirdPartyEmailAddress',
    'thirdPartyContactNumber',
    'thirdPartySafeToCall',
    'thirdPartyAddress',
    'thirdPartyPostcode',
    'thirdPartyRelationshipToClient',
    'thirdPartyPassphraseSetUp',
    'thirdPartyPassphrase'
  ]);

  // Check for validation errors
  if (await handleEditThirdPartyValidationErrors(req, res, caseReference, formFields)) {
    return;
  }

  try {
    devLog(`Editing third party contact for case: ${caseReference}`);

    // Prepare the third party data for the API
    const thirdPartyData = prepareThirdPartyData(formFields);

    // Call the API to update third party contact
    const response = await apiService.updateThirdPartyContact(req.axiosMiddleware, caseReference, thirdPartyData);

    if (response.status === 'success') {
      devLog(`Third party contact successfully updated for case: ${caseReference}`);
      
      // Clear session data after successful update
      clearSessionData(req, 'thirdPartyOriginal');
      
      res.redirect(`/cases/${caseReference}/client-details`);
    } else {
      devError(`Failed to update third party contact for case: ${caseReference}. API response: ${response.message ?? 'Unknown error'}`);
      res.status(INTERNAL_SERVER_ERROR).render('main/error.njk', {
        status: '500',
        error: response.message ?? 'Failed to update third party contact'
      });
    }
  } catch (error) {
    // Use the error processing utility
    const processedError = createProcessedError(error, `updating third party contact for case ${caseReference}`);

    // Pass the processed error to the global error handler
    next(processedError);
  }
}
