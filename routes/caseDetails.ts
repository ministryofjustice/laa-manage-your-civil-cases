import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { handleCaseDetailsTab, acceptCase, completeCase, closeCase, getCloseCaseForm, getPendingCaseForm, pendingCase, getReopenCaseForm, reopenCase } from '#src/scripts/controllers/caseDetailsController.js';
import { handleCaseHistoryTab } from '#src/scripts/controllers/caseHistoryController.js';
import { getRemoveThirdPartyConfirmation, deleteThirdParty, getRemoveSupportNeedsConfirmation, deleteClientSupportNeeds } from '#src/scripts/controllers/index.js';
import { validateReopenCase } from '#src/middlewares/reopenCaseSchema.js';
import { validateCloseCase } from '#src/middlewares/closeCaseSchema.js';
import { validatePendingCase } from '#src/middlewares/pendingCaseSchema.js';
import { fetchClientDetails } from '#middleware/caseDetailsMiddleware.js';

// Create a new router for case details routes
const router = express.Router();

/* GET client details for a specific case. */
router.get('/:caseReference/client-details', fetchClientDetails, function (req: Request, res: Response, next: NextFunction): void {
  handleCaseDetailsTab(req, res, next, 'client_details');
});

/* GET case details details for a specific case. */
router.get('/:caseReference/case-details', fetchClientDetails, function (req: Request, res: Response, next: NextFunction): void {
  handleCaseDetailsTab(req, res, next, 'case_details');
});

/* GET financial eligibility details for a specific case. */
router.get('/:caseReference/financial-eligibility', fetchClientDetails, function (req: Request, res: Response, next: NextFunction): void {
  handleCaseDetailsTab(req, res, next, 'financial_eligibility');
});

/* GET history for a specific case. */
router.get('/:caseReference/history', fetchClientDetails, async function (req: Request, res: Response, next: NextFunction): Promise<void> {
  await handleCaseHistoryTab(req, res, next, 'history');
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
router.get('/:caseReference/confirm/remove-support-need', fetchClientDetails, function (req: Request, res: Response, next: NextFunction): void {
  getRemoveSupportNeedsConfirmation(req, res, next);
});

/* DELETE client support needs. */
router.post('/:caseReference/confirm/remove-support-need', async function (req: Request, res: Response, next: NextFunction): Promise<void> {
  await deleteClientSupportNeeds(req, res, next);
});

/* POST accept case (change status to advising). */
router.post('/:caseReference/accept', async function (req: Request, res: Response, next: NextFunction): Promise<void> {
  await acceptCase(req, res, next);
});

/* GET why-pending page (interstitial for marking case as pending). */
router.get('/:caseReference/why-pending', fetchClientDetails, function (req: Request, res: Response, next: NextFunction): void {
  getPendingCaseForm(req, res, next);
});

/* POST pending case. */
router.post('/:caseReference/why-pending', validatePendingCase(), async function (req: Request, res: Response, next: NextFunction): Promise<void> {
  await pendingCase(req, res, next);
});

/* POST complete case (change status to completed). */
router.post('/:caseReference/completed', async function (req: Request, res: Response, next: NextFunction): Promise<void> {
  await completeCase(req, res, next);
});

/* GET why-closed page (interstitial for closing a case). */
router.get('/:caseReference/why-closed', fetchClientDetails, function (req: Request, res: Response, next: NextFunction): void {
  getCloseCaseForm(req, res, next);
});

/* POST close case. */
router.post('/:caseReference/why-closed', validateCloseCase(), async function (req: Request, res: Response, next: NextFunction): Promise<void> {
  await closeCase(req, res, next);
});

/* GET why-reopen page (interstitial for reopening a case). */
router.get('/:caseReference/why-reopen', fetchClientDetails, function (req: Request, res: Response, next: NextFunction): void {
  getReopenCaseForm(req, res, next);
});

/* POST reopen case. */
router.post('/:caseReference/why-reopen', validateReopenCase(), async function (req: Request, res: Response, next: NextFunction): Promise<void> {
  await reopenCase(req, res, next);
});

export default router;
