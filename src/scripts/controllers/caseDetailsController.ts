import type { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { apiService } from '#src/services/apiService.js';
import { changeCaseStateService } from '#src/services/changeCaseStateService.js';
import { devLog, devError, createProcessedError, safeString, clearAllOriginalFormData, safeBodyString, formatValidationError, trimOrUndefined, validCaseReference } from '#src/scripts/helpers/index.js';
import { storeSessionData } from '#src/scripts/helpers/sessionHelpers.js';
import config from '#config.js';

const { MAX_NOTE_LENGTH, CHARACTER_THRESHOLD }: { MAX_NOTE_LENGTH: number; CHARACTER_THRESHOLD: number } = config;
const BAD_REQUEST = 400;
const NOT_FOUND = 404;

/**
 * Handle case details view with API data
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

  try {
    devLog(`Fetching case details for case: ${caseReference}, tab: ${activeTab}`);

    // Clear any lingering form session data when users navigate to client details page
    // This automatically clears all session keys containing 'Original' (e.g., 'thirdPartyOriginal', 'clientNameOriginal', etc.)
    clearAllOriginalFormData(req);

    // Fetch client details from API
    const response = await apiService.getClientDetails(req.axiosMiddleware, caseReference);

    if (response.status === 'success' && response.data !== null) {
      // Cache soft-deleted third party state in session to optimize add/remove operations
      // addClientThirdPartyController uses this to decide POST (create) vs PATCH (restore)
      const hasSoftDeletedThirdParty = response.data.thirdParty?.isSoftDeleted ?? false;

      storeSessionData(req, 'thirdPartyCache', {
        caseReference,
        hasSoftDeletedThirdParty: String(hasSoftDeletedThirdParty),
        cachedAt: String(Date.now())
      });

      res.render('case_details/index.njk', {
        activeTab,
        client: response.data,
        caseReference: response.data.caseReference
      });
    } else {
      devError(`Client details not found for case: ${caseReference}. API response: ${response.message ?? 'Unknown error'}`);
      res.status(NOT_FOUND).render('main/error.njk', {
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

/**
 * Handle accepting a case (change status to advising)
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next function
 * @returns {Promise<void>} Redirect to case details page
 */
export async function acceptCase(req: Request, res: Response, next: NextFunction): Promise<void> {
  const caseReference = safeString(req.params.caseReference);

  if (!validCaseReference(caseReference, res)) {
    return;
  }

  try {
    devLog(`Accepting case: ${caseReference}`);
    await changeCaseStateService.acceptCase(req.axiosMiddleware, caseReference);

    // Redirect back to the referring page (stays on current tab)
    const referer = req.get('Referer') ?? `/cases/${caseReference}/client-details`;
    res.redirect(referer);
  } catch (error) {
    const processedError = createProcessedError(error, `accepting case ${caseReference}`);
    next(processedError);
  }
}

/**
 * Handle completing a case (change status to completed)
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next function
 * @returns {Promise<void>} Redirect to case details page
 */
export async function completeCase(req: Request, res: Response, next: NextFunction): Promise<void> {
  const caseReference = safeString(req.params.caseReference);

  if (!validCaseReference(caseReference, res)) {
    return;
  }

  try {
    devLog(`Completing case: ${caseReference}`);
    await changeCaseStateService.completeCase(req.axiosMiddleware, caseReference);

    // Redirect back to the referring page (stays on current tab)
    const referer = req.get('Referer') ?? `/cases/${caseReference}/client-details`;
    res.redirect(referer);
  } catch (error) {
    const processedError = createProcessedError(error, `completing case ${caseReference}`);
    next(processedError);
  }
}

/**
 * Show the pending case form (why-pending page)
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next function
 * @returns {Promise<void>} Render the why-pending page
 */
export async function getPendingCaseForm(req: Request, res: Response, next: NextFunction): Promise<void> {
  const caseReference = safeString(req.params.caseReference);

  if (!validCaseReference(caseReference, res)) {
    return;
  }

  try {
    // Fetch client details for the case header
    const response = await apiService.getClientDetails(req.axiosMiddleware, caseReference);

    if (response.status === 'success' && response.data !== null) {
      res.render('case_details/why-pending.njk', {
        caseReference,
        client: response.data,
        currentPendingReason: '',
        currentOtherNote: '',
        maxPendingNoteLength: MAX_NOTE_LENGTH,
        characterThreshold: CHARACTER_THRESHOLD,
        csrfToken: typeof req.csrfToken === 'function' ? req.csrfToken() : undefined
      });
    } else {
      res.status(NOT_FOUND).render('main/error.njk', {
        status: '404',
        error: response.message ?? 'Case not found'
      });
    }
  } catch (error) {
    const processedError = createProcessedError(error, `fetching case details for pending form ${caseReference}`);
    next(processedError);
  }
}

/**
 * Show the close case form (why-closed page)
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next function
 * @returns {Promise<void>} Render the why-closed page
 */
export async function getCloseCaseForm(req: Request, res: Response, next: NextFunction): Promise<void> {
  const caseReference = safeString(req.params.caseReference);

  if (!validCaseReference(caseReference, res)) {
    return;
  }

  try {
    // Fetch client details for the case header
    const response = await apiService.getClientDetails(req.axiosMiddleware, caseReference);

    if (response.status === 'success' && response.data !== null) {
      res.render('case_details/why-closed.njk', {
        caseReference,
        client: response.data,
        currentEventCode: '',
        currentCloseNote: '',
        maxCloseNoteLength: MAX_NOTE_LENGTH,
        characterThreshold: CHARACTER_THRESHOLD,
        csrfToken: typeof req.csrfToken === 'function' ? req.csrfToken() : undefined
      });
    } else {
      res.status(NOT_FOUND).render('main/error.njk', {
        status: '404',
        error: response.message ?? 'Case not found'
      });
    }
  } catch (error) {
    const processedError = createProcessedError(error, `fetching case details for close form ${caseReference}`);
    next(processedError);
  }
}

/**
 * Handle closing a case with event code and optional note
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next function
 * @returns {Promise<void>} Redirect to client details page
 */
export async function closeCase(req: Request, res: Response, next: NextFunction): Promise<void> {
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

    const currentEventCode = safeBodyString(req.body, 'eventCode');
    const currentCloseNote = safeBodyString(req.body, 'closeNote');

    // Fetch client details for the case header
    const response = await apiService.getClientDetails(req.axiosMiddleware, caseReference);

    if (response.status === 'success' && response.data !== null) {
      res.status(BAD_REQUEST).render('case_details/why-closed.njk', {
        caseReference,
        client: response.data,
        currentEventCode,
        currentCloseNote,
        maxCloseNoteLength: MAX_NOTE_LENGTH,
        characterThreshold: CHARACTER_THRESHOLD,
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
    const eventCode = safeString(safeBodyString(req.body, 'eventCode'));
    const closeNote = trimOrUndefined(safeBodyString(req.body, 'closeNote'));
    
    devLog(`Closing case: ${caseReference} with event code: ${eventCode}`);
    await changeCaseStateService.closeCase(req.axiosMiddleware, caseReference, eventCode, closeNote);

    // Redirect to client details page
    res.redirect(`/cases/${caseReference}/client-details`);
  } catch (error) {
    const processedError = createProcessedError(error, `closing case ${caseReference}`);
    next(processedError);
  }
}

/**
 * Handle marking a case as pending with reason
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next function
 * @returns {Promise<void>} Redirect to client details page
 */
export async function pendingCase(req: Request, res: Response, next: NextFunction): Promise<void> {
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

    const errorSummaryList = validationErrors.map(({ field, summaryMessage }) => ({
      text: summaryMessage,
      href: `#${field}`
    }));

    const currentPendingReason = safeBodyString(req.body, 'pendingReason');
    const currentOtherNote = safeBodyString(req.body, 'otherNote');

    // Fetch client details for the case header
    const response = await apiService.getClientDetails(req.axiosMiddleware, caseReference);

    if (response.status === 'success' && response.data !== null) {
      res.status(BAD_REQUEST).render('case_details/why-pending.njk', {
        caseReference,
        client: response.data,
        currentPendingReason,
        currentOtherNote,
        maxPendingNoteLength: MAX_NOTE_LENGTH,
        characterThreshold: CHARACTER_THRESHOLD,
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
    const pendingReason = safeString(safeBodyString(req.body, 'pendingReason'));
    const otherNote = safeBodyString(req.body, 'otherNote');

    // Map of reason values to their display text
    const reasonTextMap: Record<string, string> = {
      'not_ready': 'Not ready for determination',
      'can_not_contact': 'Cannot contact client',
      'third_party': 'Third party authorisation',
      'consent_from_another': 'Consent from another provider',
      'requires_interpreter': 'Requires interpreter',
      'other': typeof otherNote === 'string' ? otherNote : ''
    };

    const notes = reasonTextMap[pendingReason] ?? pendingReason;

    devLog(`Marking case as pending: ${caseReference} with reason: ${pendingReason}`);
    await changeCaseStateService.pendingCase(req.axiosMiddleware, caseReference, notes);

    // Redirect to client details page
    res.redirect(`/cases/${caseReference}/client-details`);
  } catch (error) {
    const processedError = createProcessedError(error, `marking case as pending ${caseReference}`);
    next(processedError);
  }
}

/**
 * Show the reopen case form (why-reopen page)
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next function
 * @returns {void} Render the why-reopen page
 */
export async function getReopenCaseForm(req: Request, res: Response, next: NextFunction): Promise<void> {
  const caseReference = safeString(req.params.caseReference);

  if (!validCaseReference(caseReference, res)) {
    return;
  }

  try {
    // Fetch client details for the case header
    const response = await apiService.getClientDetails(req.axiosMiddleware, caseReference);

    if (response.status === 'success' && response.data !== null) {
      res.render('case_details/why-reopen.njk', {
        caseReference,
        client: response.data,
        currentReopenNote: '',
        csrfToken: typeof req.csrfToken === 'function' ? req.csrfToken() : undefined
      });
    } else {
      res.status(NOT_FOUND).render('main/error.njk', {
        status: '404',
        error: response.message ?? 'Case not found'
      });
    }
  } catch (error) {
    const processedError = createProcessedError(error, `fetching case details for reopen form ${caseReference}`);
    next(processedError);
  }
}

/**
 * Handle reopening a case with a note
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next function
 * @returns {Promise<void>} Redirect to advising cases page
 */
export async function reopenCase(req: Request, res: Response, next: NextFunction): Promise<void> {
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

    const currentReopenNote = safeBodyString(req.body, 'reopenNote');

    // Fetch client details for the case header
    const response = await apiService.getClientDetails(req.axiosMiddleware, caseReference);

    if (response.status === 'success' && response.data !== null) {
      res.status(BAD_REQUEST).render('case_details/why-reopen.njk', {
        caseReference,
        client: response.data,
        currentReopenNote,
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
    const reopenNote = safeString(safeBodyString(req.body, 'reopenNote'));
    devLog(`Reopening case: ${caseReference}`);
    await changeCaseStateService.reopenCase(req.axiosMiddleware, caseReference, reopenNote);

    // Redirect to advising cases page
    res.redirect('/cases/advising');
  } catch (error) {
    const processedError = createProcessedError(error, `reopening case ${caseReference}`);
    next(processedError);
  }
}