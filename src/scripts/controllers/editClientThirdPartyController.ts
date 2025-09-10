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
    dataExtractor: (apiData: unknown) => {
      if (!apiData || typeof apiData !== 'object' || !('thirdParty' in apiData)) {
        return {};
      }
      
      const thirdParty = (apiData as any).thirdParty;
      if (!thirdParty || typeof thirdParty !== 'object') {
        return {};
      }

      // Extract values from nested thirdParty object and map to form field names
      const extractedData: Record<string, unknown> = {
        // Current values for form fields
        currentThirdPartyFullName: thirdParty.fullName || '',
        currentThirdPartyEmailAddress: thirdParty.emailAddress || '',
        currentThirdPartyContactNumber: thirdParty.contactNumber || '',
        currentThirdPartySafeToCall: thirdParty.safeToCall || '',
        currentThirdPartyAddress: thirdParty.address || '',
        currentThirdPartyPostcode: thirdParty.postcode || '',
        currentThirdPartyRelationshipToClient: (thirdParty.relationshipToClient?.selected?.[0]) || '',
        currentThirdPartyPassphraseSetUp: (thirdParty.passphraseSetUp?.selected?.[0]) || '',
        currentThirdPartyPassphrase: thirdParty.passphraseSetUp?.passphrase || '',
        
        // Existing values for change detection (same values)
        existingThirdPartyFullName: thirdParty.fullName || '',
        existingThirdPartyEmailAddress: thirdParty.emailAddress || '',
        existingThirdPartyContactNumber: thirdParty.contactNumber || '',
        existingThirdPartySafeToCall: thirdParty.safeToCall || '',
        existingThirdPartyAddress: thirdParty.address || '',
        existingThirdPartyPostcode: thirdParty.postcode || '',
        existingThirdPartyRelationshipToClient: (thirdParty.relationshipToClient?.selected?.[0]) || '',
        existingThirdPartyPassphraseSetUp: (thirdParty.passphraseSetUp?.selected?.[0]) || '',
        existingThirdPartyPassphrase: thirdParty.passphraseSetUp?.passphrase || ''
      };

      return extractedData;
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
