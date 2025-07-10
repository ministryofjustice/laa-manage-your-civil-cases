import express from 'express';
import type { Request, Response } from 'express';
import { apiService } from '#src/services/apiService.js';
import { devLog, devError } from '#src/scripts/helpers/index.js';

// Create a new router for case details routes
const router = express.Router();

/**
 * Handle client details view with API data
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {string} activeTab The active tab of the primary navigation
 * @returns {Promise<void>} Page to be returned
 */
async function handleClientDetails(req: Request, res: Response, activeTab: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/prefer-destructuring -- false positive, already using destructuring
  const { caseReference } = req.params;

  if (typeof caseReference !== 'string' || caseReference.trim() === '') {
    res.render('main/error.njk', {
      status: '400',
      error: 'Invalid case reference'
    });
    return;
  }

  try {
    devLog(`Fetching client details for case: ${caseReference}`);

    // Fetch client details from API
    const response = await apiService.getClientDetails(req.axiosMiddleware, { caseReference });

    if (response.status === 'success' && response.data !== null) {
      res.render('case_details/index.njk', {
        activeTab,
        client: response.data,
        caseReference: response.data.caseReference
      });
    } else {
      devError(`Client details not found for case: ${caseReference}. API response: ${response.message ?? 'Unknown error'}`);
      res.render('main/error.njk', {
        status: '404',
        error: response.message ?? 'Case not found'
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    devError(`Error fetching client details for case ${caseReference}: ${errorMessage}`);

    res.render('main/error.njk', {
      status: '500',
      error: 'Failed to load client details'
    });
  }
}

/* GET client details for a specific case. */
router.get('/:caseReference/client-details', async function (req: Request, res: Response): Promise<void> {
  await handleClientDetails(req, res, 'client_details');
});

/* GET scope details for a specific case. */
router.get('/:caseReference/scope', async function (req: Request, res: Response): Promise<void> {
  await handleClientDetails(req, res, 'scope');
});

/* GET financial eligibility details for a specific case. */
router.get('/:caseReference/financial-eligibility', async function (req: Request, res: Response): Promise<void> {
  await handleClientDetails(req, res, 'financial_eligibility');
});

/* GET notes and history for a specific case. */
router.get('/:caseReference/notes-and-history', async function (req: Request, res: Response): Promise<void> {
  await handleClientDetails(req, res, 'notes_and_history');
});

export default router;
