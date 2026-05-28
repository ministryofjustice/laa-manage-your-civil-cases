import type { Request, Response, NextFunction } from 'express';
import { devError, extractErrorMessage } from '#src/scripts/helpers/index.js';
import { HTTP } from '#src/services/api/base/constants.js';

/**
 * Global 404 handler - must be after all other routes
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const errorHandler404 = (req: Request, res: Response): void => {
  const { originalUrl, method } = req;

  devError(`404 - Page not found: ${method} ${originalUrl}`);

  // Provide more context-aware error messages
  let errorMessage = 'Page not found. The requested page does not exist.';

  if (originalUrl.startsWith('/case/') && originalUrl.includes('/')) {
    const pathParts = originalUrl.split('/');
    const minPathPartsForCaseReference = 3;

    if (pathParts.length >= minPathPartsForCaseReference) {
      const [, , caseReference] = pathParts; // ['', 'case', 'caseReference', ...]
      errorMessage = `Page not found. The requested page for case ${caseReference} does not exist.`;
    }
  } else if (originalUrl.startsWith('/cases/')) {
    errorMessage = 'Page not found. The requested cases page does not exist.';
  }

  res.status(HTTP.NOT_FOUND).render('main/error.njk', {
    status: HTTP.NOT_FOUND,
    error: errorMessage
  });
}

/**
 * Global error handler that catches all unhandled errors in the application.
 * @param {Error} err - The error object thrown in the application
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 */
export const errorHandlerGlobalCatchAll = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  const { originalUrl } = req;

  // Check if error already has user-friendly message, otherwise extract it
  const userFriendlyMessage = err.message !== '' ? err.message : extractErrorMessage(err);

  // Log original error details for debugging (check if there's a cause)
  const originalError = err.cause instanceof Error ? err.cause : err;
  devError(`Global error handler - URL: ${originalUrl}, Error: ${originalError.message}`);

  res.status(HTTP.INTERNAL_SERVER_ERROR).render('main/error.njk', {
    status: HTTP.INTERNAL_SERVER_ERROR,
    error: userFriendlyMessage
  });
}