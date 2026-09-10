import express from 'express';
import { showHelpPage, showAccessibilityPage } from '#src/scripts/controllers/footerController.js';
import { showCookiesPage } from '#src/scripts/controllers/cookiesController.js';

// Create a new router for footer links pages
const router = express.Router();

/* GET help page. */
router.get('/help', showHelpPage);

/* GET accessibility page. */
router.get('/accessibility', showAccessibilityPage);

/* GET cookies page. */
router.get('/cookies', showCookiesPage);

export default router;

