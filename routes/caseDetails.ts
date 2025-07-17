import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { apiService } from '#src/services/apiService.js';
import { devLog, devError, createProcessedError } from '#src/scripts/helpers/index.js';

// Create a new router for case details routes
const router = express.Router();

/**
 * Handle case details view with API data
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next function
 * @param {string} activeTab The active tab of the primary navigation
 * @returns {Promise<void>} Page to be returned
 */
async function handleCaseDetailsTab(req: Request, res: Response, next: NextFunction, activeTab: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/prefer-destructuring -- false positive, already using destructuring
  const { caseReference } = req.params;

  if (typeof caseReference !== 'string' || caseReference.trim() === '') {
    const httpBadRequest = 400;
    res.status(httpBadRequest).render('main/error.njk', {
      status: '400',
      error: 'Invalid case reference'
    });
    return;
  }

  try {
    devLog(`Fetching case details for case: ${caseReference}, tab: ${activeTab}`);

    // Fetch client details from API
    const response = await apiService.getClientDetails(req.axiosMiddleware, caseReference);

    if (response.status === 'success' && response.data !== null) {
      res.render('case_details/index.njk', {
        activeTab,
        client: response.data,
        caseReference: response.data.caseReference
      });
    } else {
      devError(`Client details not found for case: ${caseReference}. API response: ${response.message ?? 'Unknown error'}`);
      const httpNotFound = 404;
      res.status(httpNotFound).render('main/error.njk', {
        status: '404',
        error: response.message ?? 'Case not found'
      });
    }
  } catch (error) {
    // Use the error processing utility
    const processedError = createProcessedError(error, `fetching client details for case ${caseReference}`);

    // Pass the processed error to the global error handler
    next(processedError);
  }
}

/* GET client details for a specific case. */
router.get('/:caseReference/client-details', async function (req: Request, res: Response, next: NextFunction): Promise<void> {
  await handleCaseDetailsTab(req, res, next, 'client_details');
});

/* GET scope details for a specific case. */
router.get('/:caseReference/scope', async function (req: Request, res: Response, next: NextFunction): Promise<void> {
  await handleCaseDetailsTab(req, res, next, 'scope');
});

/* GET financial eligibility details for a specific case. */
router.get('/:caseReference/financial-eligibility', async function (req: Request, res: Response, next: NextFunction): Promise<void> {
  await handleCaseDetailsTab(req, res, next, 'financial_eligibility');
});

/* GET notes and history for a specific case. */
router.get('/:caseReference/notes-and-history', async function (req: Request, res: Response, next: NextFunction): Promise<void> {
  await handleCaseDetailsTab(req, res, next, 'notes_and_history');
});

export default router;
