import type { Request, Response, NextFunction } from 'express';
import { apiService } from '#src/services/apiService.js';
import { devLog, devError, createProcessedError, safeString } from '#src/scripts/helpers/index.js';
import { getSessionData, clearSessionData } from '#src/scripts/helpers/sessionHelpers.js';

/**
 * Handle third party removal confirmation using cached session data
 * @param {Request} req Express request object
 * @param {string} caseReference Case reference to check
 * @param {Response} res Express response object
 * @returns {void}
 */
function handleCachedThirdPartyCheck(
  req: Request,
  caseReference: string,
  res: Response
): void {
  const cachedData = getSessionData(req, 'thirdPartyCache');
  const isCacheHit = cachedData?.caseReference === caseReference;
  const hasSoftDeletedThirdParty = isCacheHit && cachedData.hasSoftDeletedThirdParty === 'true';

  // Case 1: Soft-deleted third party in cache → render 404
  if (hasSoftDeletedThirdParty) {
    devError(`No active third party to remove for case: ${caseReference} (soft-deleted found in cache)`);
    res.status(NOT_FOUND).render('main/error.njk', {
      status: '404',
      error: 'No third party contact found for this case'
    });
    return;
  }

  // Case 2: Active third party in cache → render confirmation
  if (isCacheHit) {
    devLog(`Using cached third party state for case: ${caseReference}`);
    res.render('case_details/confirm-remove-third-party.njk', {
      caseReference
    });
    return;
  }

  // Case 3: Cache miss → render 500 (expired session or server issue)
  devError(`Cache miss for case: ${caseReference} - session expired or invalid`);
  res.status(INTERNAL_SERVER_ERROR).render('main/error.njk', {
    status: '500',
    error: 'Session expired or invalid. Please reload the case details page.'
  });
}

const BAD_REQUEST = 400;
const NOT_FOUND = 404;
const INTERNAL_SERVER_ERROR = 500;

/**
 * Render the remove third party confirmation page
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next function
 * @returns {Promise<void>} Renders the confirmation page
 */
export async function getRemoveThirdPartyConfirmation(req: Request, res: Response, next: NextFunction): Promise<void> {
  const caseReference = safeString(req.params.caseReference);

  if (typeof caseReference !== 'string' || caseReference.trim() === '') {
    res.status(BAD_REQUEST).render('main/error.njk', {
      status: '400',
      error: 'Invalid case reference'
    });
    return;
  }

  try {
    devLog(`Rendering remove third party confirmation for case: ${caseReference}`);
    handleCachedThirdPartyCheck(req, caseReference, res);
  } catch (error) {
    // Use the error processing utility
    const processedError = createProcessedError(error, `rendering remove third party confirmation for case ${caseReference}`);

    // Pass the processed error to the global error handler
    next(processedError);
  }
}

/**
 * Handle DELETE request for removing third party contact
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next function
 */
export async function deleteThirdParty(req: Request, res: Response, next: NextFunction): Promise<void> {
  const caseReference = safeString(req.params.caseReference);

  if (typeof caseReference !== 'string' || caseReference.trim() === '') {
    res.status(BAD_REQUEST).render('main/error.njk', {
      status: '400',
      error: 'Invalid case reference'
    });
    return;
  }

  try {
    devLog(`Removing third party contact for case: ${caseReference}`);

    // Call API service to remove third party data
    const response = await apiService.deleteThirdPartyContact(req.axiosMiddleware, caseReference);

    if (response.status === 'success') {
      devLog(`Third party contact successfully removed for case: ${caseReference}`);
      // Clear the cache after successful deletion
      clearSessionData(req, 'thirdPartyCache');
      // Redirect back to client details page
      res.redirect(`/cases/${caseReference}/client-details`);
    } else if (response.message?.includes('404') === true) {
      // Third party already removed or doesn't exist - treat as success (idempotent)
      devLog(`Third party contact already removed or not found for case: ${caseReference}. Treating as success.`);
      // Clear the cache
      clearSessionData(req, 'thirdPartyCache');
      res.redirect(`/cases/${caseReference}/client-details`);
    } else {
      devError(`Failed to remove third party contact for case: ${caseReference}. API response: ${response.message ?? 'Unknown error'}`);
      res.status(INTERNAL_SERVER_ERROR).render('main/error.njk', {
        status: '500',
        error: response.message ?? 'Failed to remove third party contact'
      });
    }
  } catch (error) {
    // Use the error processing utility
    const processedError = createProcessedError(error, `removing third party contact for case ${caseReference}`);

    // Pass the processed error to the global error handler
    next(processedError);
  }
}
