import express from 'express';
import { processLogin, processLogout } from '#src/scripts/controllers/loginController.js';
import { validateLoginDetails } from '#src/middlewares/loginInputSchema.js';

// Create a new router for search routes
const router = express.Router();

/* GET login page */
router.get('/', processLogin);

/* POST login page submission */
router.post('/', validateLoginDetails(), processLogin);

/* GET logout, clear session and redirect to login page */
router.get('/logout', processLogout);

export default router