import express from 'express';
import type { Request, Response } from 'express';
import {
	startSilasLogin,
	handleSilasCallback,
	handleSilasLogout,
} from '#src/scripts/controllers/loginController.js';
import {
	testEnvStartTestEnvLogin,
	testEnvHandleTestEnvLoginSubmit,
	testEnvHandleSilasLogoutTestEnv,
} from '#src/scripts/controllers/testEnvLoginController.js';

const isTestEnvironment = process.env.NODE_ENV === 'test';

// Create a new router for search routes
const router = express.Router();

/* GET login page */
router.get('/', (req: Request, res: Response) => {
	if (isTestEnvironment) {
		testEnvStartTestEnvLogin(req, res);
		return;
	}

	void startSilasLogin(req, res);
});


/* POST test login handler (active in NODE_ENV=test only) */
router.post('/', (req: Request, res: Response) => {
	if (isTestEnvironment) {
		testEnvHandleTestEnvLoginSubmit(req, res);
		return;
	}

	res.status(404).render('main/error.njk', {
		status: '404',
		error: 'Not found',
	});
});

/* GET SILAS callback */
router.get('/callback', (req: Request, res: Response) => {
	void handleSilasCallback(req, res);
});

/* GET logout, clear session and redirect to login page */
router.get('/logout', (req: Request, res: Response) => {
	if (isTestEnvironment) {
		testEnvHandleSilasLogoutTestEnv(req, res);
		return;
	}

	handleSilasLogout(req, res);
});

export default router