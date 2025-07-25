import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { handleCaseDetailsTab } from '#src/scripts/controllers/caseDetailsController.js';

// Create a new router for case details routes
const router = express.Router();

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
