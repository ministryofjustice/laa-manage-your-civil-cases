import express from 'express';
import type { Request, Response } from 'express';
import yourCasesRouter from './yourCases.js';
import caseDetailsRouter from './caseDetails.js';
import editClientDetailsRouter from './editClientDetails.js';
import searchRouter from './search.js';
import loginAndLogoutRouter from './loginAndLogout.js';
import { requireAuth } from '#src/middlewares/indexSetUp.js';
import { HTTP } from '#src/services/api/base/constants.js';

// Create a new router
const router = express.Router();

/* GET home page (no auth required) - redirect to cases once authorised. */
router.get('/', requireAuth, (req: Request, res: Response): void => {
  res.redirect('/cases/new');
});

// Mount the AuthN route
router.use('/auth', loginAndLogoutRouter);

// Logout route at root level (no auth required)
router.get('/auth/logout', loginAndLogoutRouter);

// Mount the cases routes (auth required)
router.use('/cases', requireAuth, yourCasesRouter);

// Mount the case details routes (auth required)
router.use('/cases', requireAuth, caseDetailsRouter);

// Mount the edit client details routes (auth required)
router.use('/cases', requireAuth, editClientDetailsRouter);

// Mount the search routes (auth required)
router.use('/search', requireAuth, searchRouter);

/* GET liveness and readiness probes for Helm deployments */
router.get('/status', (req: Request, res: Response): void => {
  res.status(HTTP.SUCCESSFUL_REQUEST).send('OK');
});

/* GET health checks for monitoring */
router.get('/health', (req: Request, res: Response): void => {
  res.status(HTTP.SUCCESSFUL_REQUEST).send('Healthy');
});

export default router;
