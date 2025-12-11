import type { Request, Response, NextFunction } from '#node_modules/@types/express/index.js';
import type { ClientHistoryApiResponse } from '#types/api-types.js';
import { apiService } from '#src/services/apiService.js';
import { createPaginationForGivenDataSet, safeString } from '../helpers/dataTransformers.js';
import { devLog, devError } from '../helpers/devLogger.js';
import { createProcessedError } from '../helpers/errorHandler.js';
import { validCaseReference } from '../helpers/formControllerHelpers.js';
import { clearAllOriginalFormData } from '../helpers/sessionHelpers.js';

const NOT_FOUND = 404;
const PAGE_SIZE = 10;

/**
 * Handle case view with history API data
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next function
 * @param {string} activeTab The active tab of the primary navigation
 * @returns {Promise<void>} Page to be returned
 */
export async function handleCaseHistoryTab(req: Request, res: Response, next: NextFunction, activeTab: string): Promise<void> {

  const caseReference = safeString(req.params.caseReference);

  if (!validCaseReference(caseReference, res)) {
    return;
  }

  // Clear any lingering form session data when users navigate to history page
  clearAllOriginalFormData(req);

  try {
    devLog(`Fetching case history details for case: ${caseReference}, tab: ${activeTab}`);

    // Client details already fetched by middleware, available at req.clientData
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call -- apiService type inference issue
    const historyResponse: ClientHistoryApiResponse = await apiService.getClientHistoryDetails(req.axiosMiddleware, caseReference);

    if (historyResponse.status === 'success' && historyResponse.data !== null) {
      // Pagination setup
      const { slicedItems: slicedHistoryLogs, paginationMeta } = createPaginationForGivenDataSet(
        historyResponse.data,
        req.query.page,
        `/cases/${caseReference}/history`,
        PAGE_SIZE
      );

      res.render('case_details/index.njk', {
        activeTab,
        client: req.clientData,
        history: slicedHistoryLogs, // only logs for this page
        pagination: paginationMeta,
        caseReference
      });
    } else {
      devError(`History not found for case: ${caseReference}. API response: ${historyResponse.message ?? 'Unknown error'}`);
      res.status(NOT_FOUND).render('main/error.njk', {
        status: '404',
        error: historyResponse.message ?? 'History not found'
      });
    }
  } catch (error) {
    // Use the error processing utility
    const processedError = createProcessedError(error, `fetching client details for case ${caseReference}`);

    // Pass the processed error to the global error handler
    next(processedError);
  }
}
