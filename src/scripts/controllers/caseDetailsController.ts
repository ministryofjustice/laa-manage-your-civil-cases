import type { Request, Response, NextFunction } from 'express';
import { apiService } from '#src/services/apiService.js';
import { devLog, devError, createProcessedError, safeString, clearAllOriginalFormData, getCaseStatusBannerConfig } from '#src/scripts/helpers/index.js';

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

  if (typeof caseReference !== 'string' || caseReference.trim() === '') {
    res.status(BAD_REQUEST).render('main/error.njk', {
      status: '400',
      error: 'Invalid case reference'
    });
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
      // Generate banner configuration based on case status
      const bannerConfig = getCaseStatusBannerConfig(response.data);
      
      res.render('case_details/index.njk', {
        activeTab,
        client: response.data,
        caseReference: response.data.caseReference,
        bannerConfig
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