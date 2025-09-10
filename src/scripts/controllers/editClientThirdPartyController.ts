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
  safeString 
} from '#src/scripts/helpers/index.js';
import { apiService } from '#src/services/apiService.js';

// HTTP Status codes
const BAD_REQUEST = 400;
const INTERNAL_SERVER_ERROR = 500;

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
     * Transforms nested third party API data to flat structure for use with standard field extraction
     * @param {unknown} apiData - API response data containing nested third party object
     * @returns {Record<string, unknown>} Flattened data structure for standard field extraction
     */
    dataExtractor: (apiData: unknown): Record<string, unknown> => {
      // Early return if data structure is invalid
      if (typeof apiData !== 'object' || apiData === null || !('thirdParty' in apiData)) {
        return {};
      }
      

      const {thirdParty} = (apiData as any);
      if (typeof thirdParty !== 'object' || thirdParty === null) {
        return {};
      }

      // Transform nested structure to flat structure, handling type conversions
      const flatData: Record<string, unknown> = {
        thirdPartyFullName: String(thirdParty.fullName ?? ''),
        thirdPartyEmailAddress: String(thirdParty.emailAddress ?? ''),
        thirdPartyContactNumber: String(thirdParty.contactNumber ?? ''),
        thirdPartySafeToCall: String(thirdParty.safeToCall ?? ''),
        thirdPartyAddress: String(thirdParty.address ?? ''),
        thirdPartyPostcode: String(thirdParty.postcode ?? ''),
        thirdPartyRelationshipToClient: String(thirdParty.relationshipToClient?.selected?.[0] ?? ''),
        thirdPartyPassphraseSetUp: String(thirdParty.passphraseSetUp?.selected?.[0] ?? ''),
        thirdPartyPassphrase: String(thirdParty.passphraseSetUp?.passphrase ?? '')
      };

      // Use standard field extraction on the flattened data
      const fieldConfigs = [
        { field: 'thirdPartyFullName', type: 'string' as const, includeExisting: true },
        { field: 'thirdPartyEmailAddress', type: 'string' as const, includeExisting: true },
        { field: 'thirdPartyContactNumber', type: 'string' as const, includeExisting: true },
        { field: 'thirdPartySafeToCall', type: 'string' as const, includeExisting: true },
        { field: 'thirdPartyAddress', type: 'string' as const, includeExisting: true },
        { field: 'thirdPartyPostcode', type: 'string' as const, includeExisting: true },
        { field: 'thirdPartyRelationshipToClient', type: 'string' as const, includeExisting: true },
        { field: 'thirdPartyPassphraseSetUp', type: 'string' as const, includeExisting: true },
        { field: 'thirdPartyPassphrase', type: 'string' as const, includeExisting: true }
      ];

       
      return fieldConfigs.reduce<Record<string, unknown>>((formData, config) => {
        const { field, includeExisting = false } = config;
        const fieldValue = String(flatData[field] ?? '');

        // Set current field value
        const currentKey = `current${field.charAt(0).toUpperCase()}${field.slice(1)}`;
        formData[currentKey] = fieldValue;

        // Create existing field if requested (for forms that need change detection)
        if (includeExisting) {
          const existingKey = `existing${field.charAt(0).toUpperCase()}${field.slice(1)}`;
          formData[existingKey] = fieldValue;
        }

        return formData;
      }, {});
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
    'existingThirdPartyFullName',
    'thirdPartyEmailAddress',
    'existingThirdPartyEmailAddress',
    'thirdPartyContactNumber',
    'existingThirdPartyContactNumber',
    'thirdPartySafeToCall',
    'existingThirdPartySafeToCall',
    'thirdPartyAddress',
    'existingThirdPartyAddress',
    'thirdPartyPostcode',
    'existingThirdPartyPostcode',
    'thirdPartyRelationshipToClient',
    'existingThirdPartyRelationshipToClient',
    'thirdPartyPassphraseSetUp',
    'existingThirdPartyPassphraseSetUp',
    'thirdPartyPassphrase',
    'existingThirdPartyPassphrase'
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
