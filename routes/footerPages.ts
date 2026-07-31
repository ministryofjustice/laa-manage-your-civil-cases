import express from 'express';
import { showHelpPage } from '#src/scripts/controllers/footerController.js';
import { showCookiesPage } from '#src/scripts/controllers/cookiesController.js';

// Create a new router for cookies
const router = express.Router();

/* GET help page. */
router.get('/help', showHelpPage);

/* GET cookies page. */
router.get('/cookies', showCookiesPage);

export default router;

