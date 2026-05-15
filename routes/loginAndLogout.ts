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

/* GET logout, clear session and redirect to Entra login page */
router.get('/logout', (req: Request, res: Response) => {
	handleSilasLogout(req, res);
});

/* GET test-only — bypasses OAuth for Playwright E2E tests */
if (process.env.NODE_ENV === 'test') {
  const ONE_DAY_MS = 1000 * 60 * 60 * 24;

  router.get('/test-session', (req: Request, res: Response) => {
    req.session.silasAuth = {
      accessToken: 'test-access-token',
      idToken: 'test-id-token',
      expiresAt: Date.now() + ONE_DAY_MS,
      scopes: ['openid', 'profile', 'email'],
    };
    req.session.user = {
      email: 'test-user@example.com',
      name: 'Test User',
      oid: 'test-oid-123',
    };
    req.session.save((err) => {
      if (err !== null && err !== undefined) {
        res.status(HTTP.INTERNAL_SERVER_ERROR).send('Failed to save test session');
        return;
      }
      res.redirect('/cases/new');
    });
  });
}

export default router