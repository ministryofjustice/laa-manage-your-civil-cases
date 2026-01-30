import type { Request, Response, NextFunction } from '#node_modules/@types/express/index.js';
import { safeString } from '../helpers/dataTransformers.js';
import { devLog } from '../helpers/devLogger.js';
import { createProcessedError } from '../helpers/errorHandler.js';
import { validCaseReference } from '../helpers/formControllerHelpers.js';
import { clearAllOriginalFormData } from '../helpers/sessionHelpers.js';
import config from '#config.js';

const { MAX_NOTE_LENGTH, CHARACTER_THRESHOLD }: { MAX_NOTE_LENGTH: number; CHARACTER_THRESHOLD: number } = config;

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
      maxProviderNoteLength: MAX_NOTE_LENGTH,
      characterThreshold: CHARACTER_THRESHOLD,
      caseReference
    });
  } catch (error) {
    // Use the error processing utility
    const processedError = createProcessedError(error, `fetching client details for case ${caseReference}`);
    // Pass the processed error to the global error handler
    next(processedError);
  }
}