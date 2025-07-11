import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import yourCasesRouter from './yourCases.js';
import caseDetailsRouter from './caseDetails.js';

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
router.use('/case', caseDetailsRouter);


// Make an API call with `Axios` and `middleware-axios`
// GET users from external API
router.get('/users', async function (req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Use the Axios instance attached to the request object
    const response = await req.axiosMiddleware.get('https://jsonplaceholder.typicode.com/users');
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// liveness and readiness probes for Helm deployments
router.get('/status', function (req: Request, res: Response): void {
  res.status(SUCCESSFUL_REQUEST).send('OK');
});

router.get('/health', function (req: Request, res: Response): void {
  res.status(SUCCESSFUL_REQUEST).send('Healthy');
});

// Add this to your routes for debugging (remove after testing)
router.get('/debug/env', (req, res) => {
  res.json({
    API_URL: (process.env.API_URL != null && process.env.API_URL !== '') ? 'SET:' + process.env.API_URL : 'NOT SET',
    API_KEY: (process.env.API_KEY != null && process.env.API_KEY !== '') ? 'SET:' + process.env.API_KEY : 'NOT SET',
    API_TIMEOUT: (process.env.API_TIMEOUT != null && process.env.API_TIMEOUT !== '') ? 'SET:' + process.env.API_TIMEOUT : 'DEFAULT',
    API_RETRIES: (process.env.API_RETRIES != null && process.env.API_RETRIES !== '') ? 'SET:' + process.env.API_RETRIES : 'DEFAULT',
    NODE_ENV: process.env.NODE_ENV
  });
});

export default router;
