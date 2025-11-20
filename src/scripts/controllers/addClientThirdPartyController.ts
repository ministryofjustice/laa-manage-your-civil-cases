import type { Request, Response, NextFunction } from 'express';
import 'csrf-sync'; // Import to ensure CSRF types are loaded
import { handleGetEditForm, extractFormFields, handleAddThirdPartyValidationErrors, prepareThirdPartyData, devLog, devError, createProcessedError, safeString, isSoftDeletedThirdParty, isRecord, hasProperty } from '#src/scripts/helpers/index.js';
import { apiService } from '#src/services/apiService.js';

// HTTP Status codes
const BAD_REQUEST = 400;
const INTERNAL_SERVER_ERROR = 500;

/**
 * Renders the add client third party form for a given case reference.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export async function getAddClientThirdParty(req: Request, res: Response, next: NextFunction): Promise<void> {
  await handleGetEditForm(req, res, next, {
    templatePath: 'case_details/third_party_details/add-client-third-party.njk',
    dataExtractor: (apiData: unknown): Record<string, unknown> => {
      // Check if there's a soft-deleted third party and store the flag
      const hasSoftDeletedThirdParty = isRecord(apiData) && hasProperty(apiData, 'thirdParty') 
        ? isSoftDeletedThirdParty(apiData.thirdParty) 
        : false;
      
      return {
        hasSoftDeletedThirdParty: hasSoftDeletedThirdParty.toString(),
        currentThirdPartyFullName: '',
        currentThirdPartyEmailAddress: '',
        currentThirdPartyContactNumber: '',
        currentThirdPartySafeToCall: '',
        currentThirdPartyAddress: '',
        currentThirdPartyPostcode: '',
        currentThirdPartyRelationshipToClient: '',
        currentThirdPartyPassphraseSetUp: '',
        currentThirdPartyPassphrase: ''
      };
    }
  });
}

/**
 * Handles the submission of the add third party form for a given case reference.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export async function postAddClientThirdParty(req: Request, res: Response, next: NextFunction): Promise<void> {
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
    'thirdPartyPassphrase',
    'hasSoftDeletedThirdParty'
  ]);

  // Check for validation errors
  if (handleAddThirdPartyValidationErrors(req, res, caseReference, formFields)) {
    return;
  }

  try {
    devLog(`Adding third party contact for case: ${caseReference}`);

    // Prepare the third party data for the API
    const thirdPartyData = prepareThirdPartyData(formFields);

    // Check if there's a soft-deleted third party record (from hidden form field)
    const hasSoftDeletedThirdParty = formFields.hasSoftDeletedThirdParty === 'true';
    
    // Call appropriate API method (PATCH for soft-deleted, POST for new)
    const response = hasSoftDeletedThirdParty
      ? await apiService.updateThirdPartyContact(req.axiosMiddleware, caseReference, thirdPartyData)
      : await apiService.addThirdPartyContact(req.axiosMiddleware, caseReference, thirdPartyData);

    if (response.status === 'success') {
      devLog(`Third party contact successfully added for case: ${caseReference}`);
      res.redirect(`/cases/${caseReference}/client-details`);
    } else {
      devError(`Failed to add third party contact for case: ${caseReference}. API response: ${response.message ?? 'Unknown error'}`);
      res.status(INTERNAL_SERVER_ERROR).render('main/error.njk', {
        status: '500',
        error: response.message ?? 'Failed to add third party contact'
      });
    }
  } catch (error) {
    // Use the error processing utility
    const processedError = createProcessedError(error, `adding third party contact for case ${caseReference}`);

    // Pass the processed error to the global error handler
    next(processedError);
  }
}
