import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { handleClientDetailsTab, acceptCase, completeCase, closeCase, getCloseCaseForm, getPendingCaseForm, pendingCase, getReopenCaseForm, reopenCompletedCase, reopenClosedCase } from '#src/scripts/controllers/clientDetailsController.js';
import { handleCaseHistoryTab } from '#src/scripts/controllers/caseHistoryController.js';
import { handleCaseDetailsTab, saveProviderNote } from '#src/scripts/controllers/caseDetailsController.js';
import { getRemoveThirdPartyConfirmation, deleteThirdParty, getRemoveSupportNeedsConfirmation, deleteClientSupportNeeds } from '#src/scripts/controllers/index.js';
import { getOperatorFeedbackForm, submitOperatorFeedback, getDoYouWantToGiveFeedbackForm, submitDoYouWantToGiveFeedbackForm } from '#src/scripts/controllers/operatorFeedbackController.js';
import { getAboutNewCaseForm } from '#src/scripts/controllers/aboutNewSplitCaseController.js';
import { getSplitThisCaseForm, submitSplitThisCaseForm } from '#src/scripts/controllers/splitCaseController.js';
import { validateReopenCase, validateCloseCase, validatePendingCase, validateOperatorFeedback, validateProviderNote, fetchClientDetails, validateGiveFeedback, validateSplitThisCase } from '#src/middlewares/indexSchema.js';

// Create a new router for case details routes
const router = express.Router();

/* GET client details for a specific case. */
router.get('/:caseReference/client-details', fetchClientDetails, (req: Request, res: Response, next: NextFunction): void => {
  handleClientDetailsTab(req, res, next, 'client_details');
});

/* GET case details details for a specific case. */
router.get('/:caseReference/case-details', fetchClientDetails, (req: Request, res: Response, next: NextFunction): void => {
  handleCaseDetailsTab(req, res, next, 'case_details');
});

/* POST save provider note for a case. */
router.post('/:caseReference/case-details', validateProviderNote(), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  await saveProviderNote(req, res, next);
});

/* GET financial eligibility details for a specific case. */
router.get('/:caseReference/financial-eligibility', fetchClientDetails, (req: Request, res: Response, next: NextFunction): void => {
  handleClientDetailsTab(req, res, next, 'financial_eligibility');
});

/* GET history for a specific case. */
router.get('/:caseReference/history', fetchClientDetails, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  await handleCaseHistoryTab(req, res, next, 'history');
});

/* GET confirmation page for removing third party. */
router.get('/:caseReference/confirm/remove-third-party', fetchClientDetails, (req: Request, res: Response, next: NextFunction): void => {
  getRemoveThirdPartyConfirmation(req, res, next);
});

/* DELETE third party contact. */
router.post('/:caseReference/confirm/remove-third-party', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  await deleteThirdParty(req, res, next);
});

/* GET confirmation page for removing client support needs. */
router.get('/:caseReference/confirm/remove-support-need', fetchClientDetails, (req: Request, res: Response, next: NextFunction): void => {
  getRemoveSupportNeedsConfirmation(req, res, next);
});

/* DELETE client support needs. */
router.post('/:caseReference/confirm/remove-support-need', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  await deleteClientSupportNeeds(req, res, next);
});

/* POST accept case (change status to advising). */
router.post('/:caseReference/accept', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  await acceptCase(req, res, next);
});

/* GET why-pending page (interstitial for marking case as pending). */
router.get('/:caseReference/why-pending', fetchClientDetails, (req: Request, res: Response, next: NextFunction): void => {
  getPendingCaseForm(req, res, next);
});

/* POST pending case. */
router.post('/:caseReference/why-pending', validatePendingCase(), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  await pendingCase(req, res, next);
});

/* POST complete case (change status to completed). */
router.post('/:caseReference/completed', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  await completeCase(req, res, next);
});

/* GET why-closed page (interstitial for closing a case). */
router.get('/:caseReference/why-closed', fetchClientDetails, (req: Request, res: Response, next: NextFunction): void => {
  getCloseCaseForm(req, res, next);
});

/* POST close case. */
router.post('/:caseReference/why-closed', validateCloseCase(), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  await closeCase(req, res, next);
});

/* GET why-reopen-completed-case page (interstitial for reopening a case). */
router.get('/:caseReference/why-reopen-completed-case', fetchClientDetails, (req: Request, res: Response, next: NextFunction): void => {
  getReopenCaseForm(req, res, 'completedCase', next);
});

/* POST reopen completed case. */
router.post('/:caseReference/why-reopen-completed-case', validateReopenCase(), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  await reopenCompletedCase(req, res, next);
});

/* GET why-reopen-closed-case page (interstitial for advising a case). */
router.get('/:caseReference/why-reopen-closed-case', fetchClientDetails, (req: Request, res: Response, next: NextFunction): void => {
  getReopenCaseForm(req, res, 'closedCase', next);
});

/* POST reopen closed case. */
router.post('/:caseReference/why-reopen-closed-case', validateReopenCase(), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  await reopenClosedCase(req, res, next);
});

/* GET operator feedback form. */
router.get('/:caseReference/give-operator-feedback', fetchClientDetails, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  await getOperatorFeedbackForm(req, res, next);
});

/* POST operator feedback. */
router.post('/:caseReference/give-operator-feedback', validateOperatorFeedback(), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  await submitOperatorFeedback(req, res, next);
});

/* GET do-you-want-to-give-feedback form. */
router.get('/:caseReference/do-you-want-to-give-feedback', fetchClientDetails, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  await getDoYouWantToGiveFeedbackForm(req, res, next);
});

/* POST do-you-want-to-give-feedback form. */
router.post('/:caseReference/do-you-want-to-give-feedback', validateGiveFeedback(), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  await submitDoYouWantToGiveFeedbackForm(req, res, next);
});

/* GET about new case form. */
router.get('/:caseReference/about-new-case', fetchClientDetails, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  await getAboutNewCaseForm(req, res, next);
});

/* GET split-this-case form. */
router.get('/:caseReference/split-this-case', fetchClientDetails, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  await getSplitThisCaseForm(req, res, next);
});

/* POST split-this-case form. */
router.post('/:caseReference/split-this-case', fetchClientDetails, validateSplitThisCase(), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  await submitSplitThisCaseForm(req, res, next);
});


export default router;
