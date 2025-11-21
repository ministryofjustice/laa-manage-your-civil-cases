import type { Request, Response, NextFunction } from 'express';
import 'csrf-sync'; // Import to ensure CSRF types are loaded
import { handleGetEditForm, extractFormFields, handleAddThirdPartyValidationErrors, prepareThirdPartyData, devLog, devError, createProcessedError, safeString } from '#src/scripts/helpers/index.js';
import { getSessionData, clearSessionData } from '#src/scripts/helpers/sessionHelpers.js';
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
    fieldConfigs: [
      { field: 'thirdPartyFullName', type: 'string' },
      { field: 'thirdPartyEmailAddress', type: 'string' },
      { field: 'thirdPartyContactNumber', type: 'string' },
      { field: 'thirdPartySafeToCall', type: 'boolean' },
      { field: 'thirdPartyAddress', type: 'string' },
      { field: 'thirdPartyPostcode', type: 'string' },
      { field: 'thirdPartyRelationshipToClient', type: 'string' }
    ]
  });
}

/**
 * Extract third party form fields from request body
 * @param {unknown} body - Request body
 * @returns {Record<string, unknown>} Extracted form fields
 */
function extractThirdPartyFormFields(body: unknown): Record<string, unknown> {
  return extractFormFields(body, [
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
}

/**
 * Process third party addition by checking cache, calling appropriate API, and handling response
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {string} caseReference - Case reference number
 * @param {Record<string, unknown>} formFields - Extracted form fields
 * @returns {Promise<void>}
 */
async function processThirdPartyAddition(
  req: Request,
  res: Response,
  caseReference: string,
  formFields: Record<string, unknown>
): Promise<void> {
  devLog(`Adding third party contact for case: ${caseReference}`);

  // Check session cache to determine if soft-deleted third party exists
  const cachedData = getSessionData(req, 'thirdPartyCache');
  const hasSoftDeletedThirdParty = cachedData?.caseReference === caseReference && 
                                    cachedData.hasSoftDeletedThirdParty === 'true';

  // Prepare the third party data for the API
  const thirdPartyData = prepareThirdPartyData(formFields);

  // Call appropriate API method (PATCH for soft-deleted, POST for new)
  const response = hasSoftDeletedThirdParty
    ? await apiService.updateThirdPartyContact(req.axiosMiddleware, caseReference, thirdPartyData)
    : await apiService.addThirdPartyContact(req.axiosMiddleware, caseReference, thirdPartyData);

  if (response.status === 'success') {
    devLog(`Third party contact successfully added for case: ${caseReference}`);
    // Clear the cache after successful addition
    clearSessionData(req, 'thirdPartyCache');
    res.redirect(`/cases/${caseReference}/client-details`);
  } else {
    devError(`Failed to add third party contact for case: ${caseReference}. API response: ${response.message ?? 'Unknown error'}`);
    res.status(INTERNAL_SERVER_ERROR).render('main/error.njk', {
      status: '500',
      error: response.message ?? 'Failed to add third party contact'
    });
  }
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

  const formFields = extractThirdPartyFormFields(req.body);

  // Check for validation errors
  if (handleAddThirdPartyValidationErrors(req, res, caseReference, formFields)) {
    return;
  }

  try {
    await processThirdPartyAddition(req, res, caseReference, formFields);
  } catch (error) {
    // Use the error processing utility
    const processedError = createProcessedError(error, `adding third party contact for case ${caseReference}`);

    // Pass the processed error to the global error handler
    next(processedError);
  }
}
