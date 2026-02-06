import type { Request, Response, NextFunction } from '#node_modules/@types/express/index.js';
import { validationResult } from 'express-validator';
import { safeString } from '../helpers/dataTransformers.js';
import { devLog } from '../helpers/devLogger.js';
import { createProcessedError } from '../helpers/errorHandler.js';
import { validCaseReference } from '../helpers/formControllerHelpers.js';
import { clearAllOriginalFormData } from '../helpers/sessionHelpers.js';
import { safeBodyString, formatValidationError } from '../helpers/index.js';
import { updateProviderNotes } from '#src/services/api/resources/clientDetailsApiService.js';
import { apiService } from '#src/services/apiService.js';
import config from '#config.js';

const { MAX_PROVIDER_NOTE_LENGTH, CHARACTER_THRESHOLD }: { MAX_PROVIDER_NOTE_LENGTH: number; CHARACTER_THRESHOLD: number } = config;
const BAD_REQUEST = 400;
const NOT_FOUND = 404;

/**
 * Handle case details with API data
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next function
 * @param {string} activeTab The active tab of the primary navigation
 * @returns {Promise<void>} Page to be returned
 */
export async function handleCaseDetailsTab(req: Request, res: Response, next: NextFunction, activeTab: string): Promise<void> {

  const caseReference = safeString(req.params.caseReference);

  if (!validCaseReference(caseReference, res)) {
    return;
  }

  // Clear any lingering form session data when users navigate to case details page
  clearAllOriginalFormData(req);

  try {
    devLog(`Fetching case details for case: ${caseReference}, tab: ${activeTab}`);

    // Client details already fetched by middleware, available at req.clientData
    const { clientData } = req;

    res.render('case_details/index.njk', {
      activeTab,
      client: clientData,
      maxProviderNoteLength: MAX_PROVIDER_NOTE_LENGTH,
      characterThreshold: CHARACTER_THRESHOLD,
      currentProviderNote: '',
      caseReference,
      csrfToken: typeof req.csrfToken === 'function' ? req.csrfToken() : undefined
    });
  } catch (error) {
    // Use the error processing utility
    const processedError = createProcessedError(error, `fetching client details for case ${caseReference}`);
    // Pass the processed error to the global error handler
    next(processedError);
  }
}

/**
 * Save provider notes for a case
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next function
 * @returns {Promise<void>} Redirect to case details page
 */
export async function saveProviderNote(req: Request, res: Response, next: NextFunction): Promise<void> {
  const caseReference = safeString(req.params.caseReference);

  if (!validCaseReference(caseReference, res)) {
    return;
  }

  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const rawErrors = errors.array({ onlyFirstError: false });

    const validationErrors = rawErrors.map((error) => {
      const field = 'path' in error && typeof error.path === 'string' ? error.path : '';
      const { inlineMessage = '', summaryMessage } = formatValidationError(error);
      return { field, inlineMessage, summaryMessage };
    });

    const inputErrors = validationErrors.reduce<Record<string, string>>((acc, { field, inlineMessage }) => {
      const inline = inlineMessage.trim();
      acc[field] = inline;
      return acc;
    }, {});

    // Build the GOV.UK error summary list
    const errorSummaryList = validationErrors.map(({ field, summaryMessage }) => ({
      text: summaryMessage,
      href: `#${field}`
    }));

    const currentProviderNote = safeBodyString(req.body, 'providerNote');

    // POST handlers don't have middleware, so fetch client details for validation error rendering
    const response = await apiService.getClientDetails(req.axiosMiddleware, caseReference);

    if (response.status === 'success' && response.data !== null) {
      res.status(BAD_REQUEST).render('case_details/index.njk', {
        activeTab: 'case_details',
        client: response.data,
        currentProviderNote,
        maxProviderNoteLength: MAX_PROVIDER_NOTE_LENGTH,
        characterThreshold: CHARACTER_THRESHOLD,
        caseReference,
        csrfToken: typeof req.csrfToken === 'function' ? req.csrfToken() : undefined,
        error: {
          inputErrors,
          errorSummaryList
        }
      });
    } else {
      res.status(NOT_FOUND).render('main/error.njk', {
        status: '404',
        error: response.message ?? 'Case not found'
      });
    }
    return;
  }

  try {
    const providerNote = safeString(safeBodyString(req.body, 'providerNote'));

    devLog(`Saving provider note for case: ${caseReference}`);
    await updateProviderNotes(req.axiosMiddleware, caseReference, providerNote);

    // Redirect back to case details tab
    res.redirect(`/cases/${caseReference}/case-details`);
  } catch (error) {
    const processedError = createProcessedError(error, `saving provider note for case ${caseReference}`);
    next(processedError);
  }
}