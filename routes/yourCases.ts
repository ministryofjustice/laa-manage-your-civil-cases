import express from 'express';
import { createCaseRouteHandler } from '#src/scripts/controllers/yourCasesController.js';

// Create a new router for your-cases routes
const router = express.Router();

/* GET your cases - new tab. */
router.get('/new', createCaseRouteHandler('new'));

/* GET your cases - opened tab. */
router.get('/opened', createCaseRouteHandler('opened'));

/* GET your cases - accepted tab. */
router.get('/accepted', createCaseRouteHandler('accepted'));

/* GET your cases - closed tab. */
router.get('/closed', createCaseRouteHandler('closed'));

export default router;
