import type { Request, Response, NextFunction } from 'express';
import 'csrf-sync'; // Import to ensure CSRF types are loaded
import { 
  handleGetEditForm, 
  extractFormFields, 
  handleThirdPartyValidationErrors, 
  prepareThirdPartyData, 
  devLog, 
  devError, 
  createProcessedError, 
  safeString 
} from '#src/scripts/helpers/index.js';
import { apiService } from '#src/services/apiService.js';

// HTTP Status codes
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
    fieldConfigs: [
      { field: 'thirdPartyFullName', type: 'string', includeExisting: true },
      { field: 'thirdPartyEmailAddress', type: 'string', includeExisting: true },
      { field: 'thirdPartyContactNumber', type: 'string', includeExisting: true },
      { field: 'thirdPartySafeToCall', type: 'boolean', includeExisting: true },
      { field: 'thirdPartyAddress', type: 'string', includeExisting: true },
      { field: 'thirdPartyPostcode', type: 'string', includeExisting: true },
      { field: 'thirdPartyRelationshipToClient', type: 'string', includeExisting: true },
      { field: 'thirdPartyPassphraseSetUp', type: 'string', includeExisting: true },
      { field: 'thirdPartyPassphrase', type: 'string', includeExisting: true }
    ]
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
    res.status(400).render('main/error.njk', {
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
  if (handleThirdPartyValidationErrors(req, res, caseReference, formFields, 'case_details/third_party_details/edit-client-third-party.njk')) {
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
