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
  safeNestedField,
  storeOriginalFormData,
  clearSessionData
} from '#src/scripts/helpers/index.js';
import { apiService } from '#src/services/apiService.js';

// HTTP Status codes
const BAD_REQUEST = 400;
const INTERNAL_SERVER_ERROR = 500;

// Constants to avoid magic numbers
const FIRST_ARRAY_INDEX = 0;

/**
 * Renders the edit client third party form for a given case reference.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export async function getEditClientThirdParty(req: Request, res: Response, next: NextFunction): Promise<void> {
  await handleGetEditForm(req, res, next, {
    templatePath: 'case_details/third_party_details/edit-client-third-party.njk',
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

      /**
       * Helper function to safely get array first element from nested structures
       * @param {string} path - Dot notation path to the object containing 'selected' array
       * @returns {string} First selected value or empty string
       */
      const getFirstSelectedValue = (path: string): string => {
        const obj = safeNestedField(apiData, path);
        if (!isRecord(obj) || !hasProperty(obj, 'selected')) {
          return '';
        }
        const { selected } = obj;
        if (Array.isArray(selected) && selected.length > FIRST_ARRAY_INDEX) {
          return safeString(selected[FIRST_ARRAY_INDEX]);
        }
        return '';
      };

      /**
       * Helper function to safely get nested passphrase value
       * @param {string} path - Dot notation path to the passphrase object
       * @returns {string} Passphrase value or empty string
       */
      const getPassphraseValue = (path: string): string => {
        const passphraseObj = safeNestedField(apiData, path);
        if (!isRecord(passphraseObj) || !hasProperty(passphraseObj, 'passphrase')) {
          return '';
        }
        return safeString(passphraseObj.passphrase);
      };

      /**
       * Helper function to convert boolean to string for radio buttons
       * @param {unknown} value - Boolean value from API
       * @returns {string} String representation for form ('true', 'false', or '')
       */
      const booleanToString = (value: unknown): string => {
        if (typeof value === 'boolean') {
          return value.toString();
        }
        // Handle string boolean values as fallback
        if (value === 'true' || value === 'false') {
          return safeString(value);
        }
        return '';
      };

      // Transform nested structure to flat structure using safe extractors
      const flatData = {
        thirdPartyFullName: safeStringFromRecord(thirdPartyData, 'fullName') ?? '',
        thirdPartyEmailAddress: safeStringFromRecord(thirdPartyData, 'emailAddress') ?? '',
        thirdPartyContactNumber: safeStringFromRecord(thirdPartyData, 'contactNumber') ?? '',
        thirdPartySafeToCall: booleanToString(thirdPartyData.safeToCall),
        thirdPartyAddress: safeStringFromRecord(thirdPartyData, 'address') ?? '',
        thirdPartyPostcode: safeStringFromRecord(thirdPartyData, 'postcode') ?? '',
        thirdPartyRelationshipToClient: getFirstSelectedValue('thirdParty.relationshipToClient'),
        thirdPartyPassphraseSetUp: getFirstSelectedValue('thirdParty.passphraseSetUp'),
        thirdPartyPassphrase: getPassphraseValue('thirdParty.passphraseSetUp')
      };

      // Store original form data in session for later comparison
      storeOriginalFormData(req, 'thirdPartyOriginal', flatData);

      // Define field configurations for current field generation (no longer need existing fields)
      const fieldConfigs = [
        { field: 'thirdPartyFullName', type: 'string' as const },
        { field: 'thirdPartyEmailAddress', type: 'string' as const },
        { field: 'thirdPartyContactNumber', type: 'string' as const },
        { field: 'thirdPartySafeToCall', type: 'string' as const },
        { field: 'thirdPartyAddress', type: 'string' as const },
        { field: 'thirdPartyPostcode', type: 'string' as const },
        { field: 'thirdPartyRelationshipToClient', type: 'string' as const },
        { field: 'thirdPartyPassphraseSetUp', type: 'string' as const },
        { field: 'thirdPartyPassphrase', type: 'string' as const }
      ];

      // Use extractCurrentFields helper to generate current form data
      return extractCurrentFields(flatData, fieldConfigs);
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

  if (typeof caseReference !== 'string' || caseReference.trim() === '') {
    res.status(BAD_REQUEST).render('main/error.njk', {
      status: '400',
      error: 'Invalid case reference'
    });
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
  if (handleEditThirdPartyValidationErrors(req, res, caseReference, formFields)) {
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
