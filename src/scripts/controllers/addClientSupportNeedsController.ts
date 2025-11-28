import type { Request, Response, NextFunction } from 'express';
import 'csrf-sync'; // Import to ensure CSRF types are loaded
import { handleGetEditForm, extractFormFields, handleAddClientSupportNeedsErrors, prepareClientSupportNeedsData, devLog, devError, createProcessedError, safeString, validCaseReference } from '#src/scripts/helpers/index.js';
import { apiService } from '#src/services/apiService.js';
import languages from '#views/case_details/client_support_needs/languages.json' with { type: 'json' };

// HTTP Status codes
const INTERNAL_SERVER_ERROR = 500;

/**
 * Renders the add client support needs for a given case reference.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export async function getAddClientSupportNeeds(req: Request, res: Response, next: NextFunction): Promise<void> {
  res.locals.languageItems = languages;
  await handleGetEditForm(req, res, next, {
    templatePath: 'case_details/client_support_needs/add-client-support-needs.njk',
    fieldConfigs: [
      { field: 'clientSupportNeeds', type: 'array' },
      { field: 'languageSupportNeeds', type: 'string' },
      { field: 'notes', type: 'string' }
    ]
  });
}

/**
 * Handles the submission of the add client support needs form for a given case reference.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export async function postAddClientSupportNeeds(req: Request, res: Response, next: NextFunction): Promise<void> {
  res.locals.languageItems = languages; 
  const caseReference = safeString(req.params.caseReference);

  if (!validCaseReference(caseReference, res)) {
    return;
  }

  const formFields = extractFormFields(req.body, [
    'clientSupportNeeds',
    'languageSupportNeeds',
    'notes'
  ]);

  // Check for validation errors
  if (await handleAddClientSupportNeedsErrors(req, res, caseReference, formFields)) {
    return;
  }

  try {
    devLog(`Adding client support needs for case: ${caseReference}`);

    // Prepare the client support needs data for the API
    const clientSupportNeeds = prepareClientSupportNeedsData(formFields);

    // Call the API to add client support needs
    const response = await apiService.addClientSupportNeeds(req.axiosMiddleware, caseReference, clientSupportNeeds);

    if (response.status === 'success') {
      devLog(`Client support needs successfully added for case: ${caseReference}`);
      res.redirect(`/cases/${caseReference}/client-details`);
    } else {
      devError(`Failed to add client support needs for case: ${caseReference}. API response: ${response.message ?? 'Unknown error'}`);
      res.status(INTERNAL_SERVER_ERROR).render('main/error.njk', {
        status: '500',
        error: response.message ?? 'Failed to add client support needs'
      });
    }
  } catch (error) {
    // Use the error processing utility
    const processedError = createProcessedError(error, `adding client support needs for case ${caseReference}`);

    // Pass the processed error to the global error handler
    next(processedError);
  }
}
