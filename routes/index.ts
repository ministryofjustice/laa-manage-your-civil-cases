import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import yourCasesRouter from './yourCases.js';
import caseDetailsRouter from './caseDetails.js';
import editClientDetailsRouter from './editClientDetails.js';
import searchRouter from './search.js';
import { devError, extractErrorMessage } from '#src/scripts/helpers/index.js';

// Create a new router
const router = express.Router();
const SUCCESSFUL_REQUEST = 200;

/* GET home page - redirect to cases. */
router.get('/', function (req: Request, res: Response): void {
  res.redirect('/cases/new');
});

// Mount the cases routes
router.use('/cases', yourCasesRouter);

// Mount the case details routes
router.use('/cases', caseDetailsRouter);

// Mount the edit client details routes
router.use('/cases', editClientDetailsRouter);

// Mount the search routes
router.use('/search', searchRouter);

// liveness and readiness probes for Helm deployments
router.get('/status', function (req: Request, res: Response): void {
  res.status(SUCCESSFUL_REQUEST).send('OK');
});

router.get('/health', function (req: Request, res: Response): void {
  res.status(SUCCESSFUL_REQUEST).send('Healthy');
});

// Global 404 handler - must be after all other routes
router.use(function (req: Request, res: Response): void {
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

  const httpNotFound = 404;
  res.status(httpNotFound).render('main/error.njk', {
    status: '404',
    error: errorMessage
  });
});

// Global error handler middleware
router.use(function (err: Error, req: Request, res: Response, next: NextFunction): void {
  const { originalUrl } = req;

  // Check if error already has user-friendly message, otherwise extract it
  const userFriendlyMessage = err.message !== '' ? err.message : extractErrorMessage(err);

  // Log original error details for debugging (check if there's a cause)
  const originalError = err.cause instanceof Error ? err.cause : err;
  devError(`Global error handler - URL: ${originalUrl}, Error: ${originalError.message}`);

  const httpInternalServerError = 500;
  res.status(httpInternalServerError).render('main/error.njk', {
    status: '500',
    error: userFriendlyMessage
  });
});

export default router;
