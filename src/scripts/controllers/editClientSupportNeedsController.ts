import type { Request, Response, NextFunction } from 'express';
import 'csrf-sync'; // Import to ensure CSRF types are loaded
import { 
  handleGetEditForm, 
  extractFormFields, 
  devLog,
  devError, 
  createProcessedError, 
  safeString,
  isRecord,
  hasProperty,
  extractCurrentFields,
  safeNestedField,
  storeOriginalFormData,
  clearSessionData,
  prepareClientSupportNeedsData,
  handleEditClientSupportNeedsErrors,
  isYes,
  capitaliseFirstLetter,
  validCaseReference
} from '#src/scripts/helpers/index.js';
import { apiService } from '#src/services/apiService.js';
import languages from '#views/case_details/client_support_needs/languages.json' with { type: 'json' };

// HTTP Status codes
const INTERNAL_SERVER_ERROR = 500;

/**
 * Renders the edit client support needs form for a given case reference.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export async function getEditClientSupportNeeds (req: Request, res: Response, next: NextFunction): Promise<void> {
 res.locals.languageItems = languages;
  await handleGetEditForm(req, res, next, {
    templatePath: 'case_details/client_support_needs/change-client-support-needs.njk',
    /**
     * Transforms client support needs API data for field extraction
     * @param {unknown} apiData - API response data containing nested third party object
     * @returns {Record<string, unknown>} Flattened data structure for field extraction
     */
    dataExtractor: (apiData: unknown): Record<string, unknown> => {
      // Early return if data structure is invalid
      if (!isRecord(apiData) || !hasProperty(apiData, 'clientSupportNeeds')) {
        return {};
      }
      // Build the array of *selected* checkbox values for the template
      const bslWebcam = safeNestedField(apiData, 'clientSupportNeeds.bslWebcam');
      const textRelay = safeNestedField(apiData, 'clientSupportNeeds.textRelay');
      const callbackPreference = safeNestedField(apiData, 'clientSupportNeeds.callbackPreference');
      const language = capitaliseFirstLetter(safeString(safeNestedField(apiData, 'clientSupportNeeds.languageSupportNeeds')));
      const notes = safeString(safeNestedField(apiData, 'clientSupportNeeds.notes'));
      const selectedCheckboxes: string[] = [];
      if (isYes(bslWebcam)) selectedCheckboxes.push('bslWebcam');
      if (isYes(textRelay)) selectedCheckboxes.push('textRelay');
      if (isYes(callbackPreference)) selectedCheckboxes.push('callbackPreference');
      // open the prefilled conditional fields
      if (safeString(language) !== '') {selectedCheckboxes.push('languageSelection');}
      if (safeString(notes) !== '') selectedCheckboxes.push('otherSupport');

      const flatData = {
        clientSupportNeeds: selectedCheckboxes,
        languageSupportNeeds: language,
        notes
      };

      storeOriginalFormData(req, 'clientSupportNeedsOriginal', flatData);

      // Generate variables for the template
      const fieldConfigs = [
        { field: 'clientSupportNeeds', type: 'array' as const },
        { field: 'languageSupportNeeds', type: 'string' as const },
        { field: 'notes', type: 'string' as const }
      ];

      // Use extractCurrentFields helper to generate current form data
      return extractCurrentFields(flatData, fieldConfigs);
    }
  });
}

/**
 * Handles the submission of the edit client support needs form for a given case reference.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 */
export async function postEditClientSupportNeeds(req: Request, res: Response, next: NextFunction): Promise<void> {
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
  if (await handleEditClientSupportNeedsErrors(req, res, caseReference, formFields)) {
    return;
  }

  try {
    devLog(`Editing client support needs for case: ${caseReference}`);

    // Prepare the client support needs data for the API
    const clientSupportNeeds = prepareClientSupportNeedsData(formFields);

    // Call the API to update third party contact
    const response = await apiService.updateClientSupportNeeds(req.axiosMiddleware, caseReference, clientSupportNeeds);

    if (response.status === 'success') {
      devLog(`Client support needs successfully updated for case: ${caseReference}`);
      
      // Clear session data after successful update
      clearSessionData(req, 'clientSupportNeedsOriginal');
      
      res.redirect(`/cases/${caseReference}/client-details`);
    } else {
      devError(`Failed to update client support needs for case: ${caseReference}. API response: ${response.message ?? 'Unknown error'}`);
      res.status(INTERNAL_SERVER_ERROR).render('main/error.njk', {
        status: '500',
        error: response.message ?? 'Failed to update client support needs'
      });
    }
  } catch (error) {
    // Use the error processing utility
    const processedError = createProcessedError(error, `updating client support needs for case ${caseReference}`);

    // Pass the processed error to the global error handler
    next(processedError);
  }
}