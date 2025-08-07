import express from 'express';
import { clearSearch, processSearch } from '#src/scripts/controllers/searchController.js';

// Create a new router for search routes
const router = express.Router();

/* GET search page. */
router.get('/', processSearch);

/* GET clear search page. */
router.get('/clear', clearSearch);

export default router;
