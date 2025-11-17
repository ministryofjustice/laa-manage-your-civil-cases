import express from 'express';
import { createCaseRouteHandler } from '#src/scripts/controllers/yourCasesController.js';

// Create a new router for your-cases routes
const router = express.Router();

/* GET your cases - new tab. */
router.get('/new', createCaseRouteHandler('new'));

/* GET your cases - pending tab. */
router.get('/pending', createCaseRouteHandler('opened'));

/* GET your cases - advising tab. */
router.get('/advising', createCaseRouteHandler('accepted'));

/* GET your cases - closed tab. */
router.get('/closed', createCaseRouteHandler('rejected'));

/* GET your cases - completed tab. */
router.get('/completed', createCaseRouteHandler('closed'));


export default router;
