import express from 'express';
import type { Request, Response } from 'express';
import { startSilasLogin, handleSilasCallback, handleSilasLogout } from '#src/scripts/controllers/loginController.js';

// Create a new router for search routes
const router = express.Router();

/* GET login page */
router.get('/', (req: Request, res: Response) => {
	void startSilasLogin(req, res);
});

/* GET SILAS callback */
router.get('/callback', (req: Request, res: Response) => {
	void handleSilasCallback(req, res);
});

/* GET logout, clear session and redirect to login page */
router.get('/logout', (req: Request, res: Response) => {
	handleSilasLogout(req, res);
});

export default router