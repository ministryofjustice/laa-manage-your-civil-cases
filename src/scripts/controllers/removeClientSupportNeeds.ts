import type { Request, Response, NextFunction } from 'express';
import { apiService } from '#src/services/apiService.js';
import { devLog, devError, createProcessedError, safeString, validCaseReference } from '#src/scripts/helpers/index.js';

const NOT_FOUND = 404;
const INTERNAL_SERVER_ERROR = 500;

/**
 * Handle GET request for remove client support needs confirmation page
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next function
 * @returns {Promise<void>} Renders the confirmation page
 */
export async function getRemoveSupportNeedsConfirmation(req: Request, res: Response, next: NextFunction): Promise<void> {
  const caseReference = safeString(req.params.caseReference);

  if (!validCaseReference(caseReference, res)) {
    return;
  }

  try {
    devLog(`Rendering remove client support needs confirmation for case: ${caseReference}`);

    // Verify the case exists and has client support needs
    const response = await apiService.getClientDetails(req.axiosMiddleware, caseReference);

    if (response.status === 'success' && response.data !== null) {
      // Check if client support needs record exists
      // Note: We allow removal even if no_adaptations_required is true, as there may still be
      // adaptation values set (BSL, language, etc.) that need to be cleared
      if (response.data.clientSupportNeeds === null) {
        devError(`No client support needs to remove for case: ${caseReference}`);
        res.status(NOT_FOUND).render('main/error.njk', {
          status: '404',
          error: 'No client support needs data found for this case'
        });
        return;
      }

      res.render('case_details/confirm-remove-client-support-needs.njk', {
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
    const processedError = createProcessedError(error, `rendering remove client support needs confirmation for case ${caseReference}`);

    // Pass the processed error to the global error handler
    next(processedError);
  }
}

/**
 * Handle DELETE request for removing client support need
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next function
 */
export async function deleteClientSupportNeeds(req: Request, res: Response, next: NextFunction): Promise<void> {
  const caseReference = safeString(req.params.caseReference);

  if (!validCaseReference(caseReference, res)) {
    return;
  }

  try {
    devLog(`Removing client support needs for case: ${caseReference}`);

    // Call API service to remove client support need data
    const response = await apiService.deleteClientSupportNeeds(req.axiosMiddleware, caseReference);

    if (response.status === 'success') {
      devLog(`Client support needs successfully removed for case: ${caseReference}`);
      // Redirect back to client details page
      res.redirect(`/cases/${caseReference}/client-details`);
    } else if (response.message?.includes('404') === true) {
      // Client support needs already removed or doesn't exist - treat as success (idempotent)
      devLog(`Client support needs already removed or not found for case: ${caseReference}. Treating as success.`);
      res.redirect(`/cases/${caseReference}/client-details`);
    } else {
      devError(`Failed to remove client support needs for case: ${caseReference}. API response: ${response.message ?? 'Unknown error'}`);
      res.status(INTERNAL_SERVER_ERROR).render('main/error.njk', {
        status: '500',
        error: response.message ?? 'Failed to remove client support needs'
      });
    }
  } catch (error) {
    // Use the error processing utility
    const processedError = createProcessedError(error, `removing client support needs for case ${caseReference}`);

    // Pass the processed error to the global error handler
    next(processedError);
  }
}
