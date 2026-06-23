import express from 'express';
import { showCookiesPage } from '#src/scripts/controllers/cookiesController.js';

// Create a new router for cookies
const router = express.Router();

/* GET cookies page. */
router.get('/', showCookiesPage);

export default router

