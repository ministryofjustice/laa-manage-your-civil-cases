import type { Request, Response, NextFunction } from 'express';
import { apiService } from '#src/services/apiService.js';
import { devLog, devError, createProcessedError, safeString } from '#src/scripts/helpers/index.js';

const BAD_REQUEST = 400;
const NOT_FOUND = 404;

/**
 * Handle GET request for remove third party confirmation page
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

    // Verify the case exists and has third party data
    const response = await apiService.getClientDetails(req.axiosMiddleware, caseReference);

    if (response.status === 'success' && response.data !== null) {
      // Check if third party data exists
      if (response.data.thirdParty === null || response.data.thirdParty === undefined) {
        devError(`No third party data found for case: ${caseReference}`);
        res.status(NOT_FOUND).render('main/error.njk', {
          status: '404',
          error: 'No third party contact found for this case'
        });
        return;
      }

      res.render('case_details/confirm-remove-third-party.njk', {
        caseReference
      });
    } else {
      devError(`Case not found: ${caseReference}. API response: ${response.message ?? 'Unknown error'}`);
      res.status(NOT_FOUND).render('main/error.njk', {
        status: '404',
        error: response.message ?? 'Case not found'
      });
    }
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
      // Redirect back to client details page
      res.redirect(`/cases/${caseReference}/client-details`);
    } else {
      devError(`Failed to remove third party contact for case: ${caseReference}. API response: ${response.message ?? 'Unknown error'}`);
      res.status(NOT_FOUND).render('main/error.njk', {
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
