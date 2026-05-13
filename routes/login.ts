import express, {type Request, type Response } from 'express';
import { startSilasLogin, handleSilasCallback, handleSilasLogout } from '#src/scripts/controllers/loginController.js';
import { HTTP } from '#src/services/api/base/constants.js';

// Create a new router for search routes
const router = express.Router();

/* GET login page */
router.get('/', (req: Request, res: Response) => {
	void startSilasLogin(req, res);
});

/* POST login page submission */
router.post('/', (res: Response) => {
	res.status(HTTP.NOT_FOUND).render('main/error.njk', {
    status: HTTP.NOT_FOUND,
    error: 'Page not found. User tried to Login via SiLAS.'
	});
});

/* GET SiLAS callback */
router.get('/callback', (req: Request, res: Response) => {
	void handleSilasCallback(req, res);
});

/* GET logout, clear session and redirect to login page */
router.get('/logout', (req: Request, res: Response) => {
	handleSilasLogout(req, res);
});

export default router