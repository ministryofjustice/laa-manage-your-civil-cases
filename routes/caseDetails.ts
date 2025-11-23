import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { handleCaseDetailsTab, acceptCase, completeCase, closeCase, getCloseCaseForm, getReopenCaseForm, reopenCase } from '#src/scripts/controllers/caseDetailsController.js';
import { getRemoveThirdPartyConfirmation, deleteThirdParty, getRemoveSupportNeedsConfirmation, deleteClientSupportNeeds } from '#src/scripts/controllers/index.js';
import { validateReopenCase } from '#src/middlewares/reopenCaseSchema.js';
import { validateCloseCase } from '#src/middlewares/closeCaseSchema.js';

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

/* GET confirmation page for removing third party. */
router.get('/:caseReference/confirm/remove-third-party', function (req: Request, res: Response, next: NextFunction): void {
  getRemoveThirdPartyConfirmation(req, res, next);
});

/* DELETE third party contact. */
router.post('/:caseReference/confirm/remove-third-party', async function (req: Request, res: Response, next: NextFunction): Promise<void> {
  await deleteThirdParty(req, res, next);
});

/* GET confirmation page for removing client support needs. */
router.get('/:caseReference/confirm/remove-support-need', async function (req: Request, res: Response, next: NextFunction): Promise<void> {
  await getRemoveSupportNeedsConfirmation(req, res, next);
});

/* DELETE client support needs. */
router.post('/:caseReference/confirm/remove-support-need', async function (req: Request, res: Response, next: NextFunction): Promise<void> {
  await deleteClientSupportNeeds(req, res, next);
});

/* POST accept case (change status to advising). */
router.post('/:caseReference/accept', async function (req: Request, res: Response, next: NextFunction): Promise<void> {
  await acceptCase(req, res, next);
});

/* POST complete case (change status to completed). */
router.post('/:caseReference/close', async function (req: Request, res: Response, next: NextFunction): Promise<void> {
  await completeCase(req, res, next);
});

/* GET why-closed page (interstitial for closing a case). */
router.get('/:caseReference/why-closed', async function (req: Request, res: Response, next: NextFunction): Promise<void> {
  await getCloseCaseForm(req, res, next);
});

/* POST close case. */
router.post('/:caseReference/why-closed', validateCloseCase(), async function (req: Request, res: Response, next: NextFunction): Promise<void> {
  await closeCase(req, res, next);
});

/* GET why-reopen page (interstitial for reopening a case). */
router.get('/:caseReference/why-reopen', function (req: Request, res: Response, next: NextFunction): void {
  getReopenCaseForm(req, res, next);
});

/* POST reopen case. */
router.post('/:caseReference/why-reopen', validateReopenCase(), async function (req: Request, res: Response, next: NextFunction): Promise<void> {
  await reopenCase(req, res, next);
});

export default router;
