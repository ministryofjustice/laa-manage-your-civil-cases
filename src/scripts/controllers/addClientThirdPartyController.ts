import type { Request, Response, NextFunction } from 'express';
import 'csrf-sync'; // Import to ensure CSRF types are loaded
import { handleGetEditForm, extractFormFields, devLog, devError, createProcessedError, safeString } from '#src/scripts/helpers/index.js';
import { apiService } from '#src/services/apiService.js';
import { validationResult } from 'express-validator';
import { formatValidationError } from '#src/scripts/helpers/ValidationErrorHelpers.js';

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
 * Handles validation errors and renders the form with error messages
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {string} caseReference - Case reference number
 * @param {Record<string, unknown>} formFields - Form field values
 * @returns {boolean} - Returns true if there were validation errors, false otherwise
 */
function handleValidationErrors(
  req: Request,
  res: Response,
  caseReference: string,
  formFields: Record<string, unknown>
): boolean {
  const rawValidationResult = validationResult(req);

  if (rawValidationResult.isEmpty()) {
    return false;
  }

  const rawErrors = rawValidationResult.array();

  const resultingErrors = rawErrors.map((error) => {
    const fieldName = 'path' in error && typeof error.path === 'string' ? error.path : '';
    const errorData = formatValidationError(error);

    return {
      fieldName,
      inlineMessage: errorData.inlineMessage,
      summaryMessage: errorData.summaryMessage,
    };
  });

  const inputErrors = resultingErrors.reduce((errors: Record<string, string>, { fieldName, inlineMessage }) => {
    if (inlineMessage.trim() !== '') {
      errors[fieldName] = inlineMessage;
    }
    return errors;
  }, {});

  const errorSummaryList = resultingErrors.map(({ summaryMessage, fieldName }) => ({
    text: summaryMessage,
    href: `#${fieldName}`,
  }));

  const renderData = {
    caseReference,
    error: { inputErrors, errorSummaryList },
    csrfToken: typeof req.csrfToken === 'function' ? req.csrfToken() : undefined,
    currentThirdPartyFullName: formFields.thirdPartyFullName,
    currentThirdPartyEmailAddress: formFields.thirdPartyEmailAddress,
    currentThirdPartyContactNumber: formFields.thirdPartyContactNumber,
    currentThirdPartySafeToCall: formFields.thirdPartySafeToCall,
    currentThirdPartyAddress: formFields.thirdPartyAddress,
    currentThirdPartyPostcode: formFields.thirdPartyPostcode,
    currentThirdPartyRelationshipToClient: formFields.thirdPartyRelationshipToClient,
    currentThirdPartyPassphraseSetUp: formFields.thirdPartyPassphraseSetUp,
    currentThirdPartyPassphrase: formFields.thirdPartyPassphrase
  };

  res.status(BAD_REQUEST).render('case_details/third_party_details/add-client-third-party.njk', renderData);
  return true;
}

/**
 * Prepares third party data for API submission
 * @param {Record<string, unknown>} formFields - Form field values
 * @returns {object} - Formatted third party data for API
 */
function prepareThirdPartyData(formFields: Record<string, unknown>): object {
  return {
    fullName: formFields.thirdPartyFullName,
    emailAddress: formFields.thirdPartyEmailAddress,
    contactNumber: formFields.thirdPartyContactNumber,
    safeToCall: formFields.thirdPartySafeToCall !== '' ? formFields.thirdPartySafeToCall : true,
    address: formFields.thirdPartyAddress,
    postcode: formFields.thirdPartyPostcode,
    relationshipToClient: {
      selected: Array.isArray(formFields.thirdPartyRelationshipToClient) ? formFields.thirdPartyRelationshipToClient : [formFields.thirdPartyRelationshipToClient]
    },
    passphraseSetUp: {
      selected: Array.isArray(formFields.thirdPartyPassphraseSetUp) ? formFields.thirdPartyPassphraseSetUp : [formFields.thirdPartyPassphraseSetUp],
      passphrase: formFields.thirdPartyPassphrase
    }
  };
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
    'thirdPartyPassphrase'
  ]);

  // Check for validation errors
  if (handleValidationErrors(req, res, caseReference, formFields)) {
    return;
  }

  try {
    devLog(`Adding third party contact for case: ${caseReference}`);

    // Prepare the third party data for the API
    const thirdPartyData = prepareThirdPartyData(formFields);

    // Call the API to add third party contact
    const response = await apiService.addThirdPartyContact(req.axiosMiddleware, caseReference, thirdPartyData);

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
