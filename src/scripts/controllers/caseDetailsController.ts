import type { Request, Response, NextFunction } from '#node_modules/@types/express/index.js';
import { validationResult } from 'express-validator';
import { safeString } from '../helpers/dataTransformers.js';
import { devLog } from '../helpers/devLogger.js';
import { createProcessedError } from '../helpers/errorHandler.js';
import { validCaseReference } from '../helpers/formControllerHelpers.js';
import { handleCaseTab } from '../helpers/caseTabHandler.js';
import { safeBodyString, formatValidationError } from '../helpers/index.js';
import { apiService } from '#src/services/apiService.js';
import config from '#config.js';

const { MAX_PROVIDER_NOTE_LENGTH, CHARACTER_THRESHOLD }: { MAX_PROVIDER_NOTE_LENGTH: number; CHARACTER_THRESHOLD: number } = config;
const BAD_REQUEST = 400;

/**
 * Handle case details with API data
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next function
 * @param {string} activeTab The active tab of the primary navigation
 * @returns {Promise<void>} Page to be returned
 */
export async function handleCaseDetailsTab(req: Request, res: Response, next: NextFunction, activeTab: string): Promise<void> {
  await handleCaseTab(req, res, next, activeTab, 'case details', ({ req, res, caseReference, activeTab }) => {
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
  });
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
    try {
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
        return;
      }

      // If case not found, create an error and delegate to global error handler
      const notFoundError = new Error(`Case ${caseReference} not found`);
      const processedError = createProcessedError(notFoundError, `fetching case details for validation error rendering`);
      next(processedError);
      return;
    } catch (error) {
      // Delegate any errors during validation error handling to global error handler
      const processedError = createProcessedError(error, `handling validation errors for case ${caseReference}`);
      next(processedError);
      return;
    }
  }

  try {
    const providerNote = safeString(safeBodyString(req.body, 'providerNote'));

    devLog(`Saving provider note for case: ${caseReference}`);
    await apiService.updateProviderNotes(req.axiosMiddleware, caseReference, providerNote);

    // Redirect back to case details tab
    res.redirect(`/cases/${caseReference}/case-details`);
  } catch (error) {
    const processedError = createProcessedError(error, `saving provider note for case ${caseReference}`);
    next(processedError);
  }
}