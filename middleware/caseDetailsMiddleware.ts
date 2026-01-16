import type { Request, Response, NextFunction } from 'express';
import { apiService } from '#src/services/apiService.js';
import { devLog, devError } from '#src/scripts/helpers/devLogger.js';
import { createProcessedError } from '#src/scripts/helpers/errorHandler.js';
import { safeString } from '#src/scripts/helpers/dataTransformers.js';
import { validCaseReference } from '#src/scripts/helpers/formControllerHelpers.js';

const NOT_FOUND = 404;

// Extend Express Request type to include clientData
declare global {
  namespace Express {
    interface Request {
      clientData?: unknown;
    }
  }
}

/**
 * Middleware to fetch and attach client details to the request object for case-related routes
 * This prevents duplicate API calls across different tab controllers
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next function
 * @returns {Promise<void>} Calls next() or renders error page
 */
export async function fetchClientDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
  const caseReference = safeString(req.params.caseReference);
  
  if (!validCaseReference(caseReference, res)) {
    return;
  }

  try {
    devLog(`[Middleware] Fetching client details for case: ${caseReference}`);

    const response = await apiService.getClientDetails(req.axiosMiddleware, caseReference);

    if (response.status === 'success' && response.data !== null) {
      // Attach client data to request object for use by controllers
      const { data } = response;
      // eslint-disable-next-line require-atomic-updates -- false positive; Express res object is per-request and cannot race
      req.clientData = data;
      next();
    } else {
      devError(`[Middleware] Client details not found for case: ${caseReference}. API response: ${response.message ?? 'Unknown error'}`);
      res.status(NOT_FOUND).render('main/error.njk', {
        status: '404',
        error: response.message ?? 'Case not found'
      });
    }
  } catch (error) {
    const processedError = createProcessedError(error, `fetching client details for case ${caseReference}`);
    next(processedError);
  }
}


