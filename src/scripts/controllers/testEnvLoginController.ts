import type { Request, Response } from 'express';
import { devError } from '#src/scripts/helpers/index.js';
import '#src/scripts/helpers/sessionHelpers.js';

const LOGIN_REDIRECT_TARGET = '/cases/new';
const TEST_TOKEN_LIFETIME_MS = 60 * 60 * 1000;

function testEnvRenderLoginError(res: Response, error: string, status = 500): void {
  res.status(status).render('main/error.njk', {
    status: String(status),
    error,
  });
}

function testEnvRenderTestLoginPage(res: Response, values: { username: string } = { username: '' }, error?: { username?: string; password?: string }): void {
  const hasError = error?.username !== undefined || error?.password !== undefined;

  res.status(200).render('login/index.njk', {
    values,
    ...(hasError
      ? {
        error: {
          errorSummaryList: [
            ...(error?.username !== undefined ? [{ text: error.username, href: '#username' }] : []),
            ...(error?.password !== undefined ? [{ text: error.password, href: '#password' }] : []),
          ],
          inputErrors: {
            username: error?.username,
            password: error?.password,
          },
        },
      }
      : {}),
  });
}

function testEnvCreateTestSession(req: Request, res: Response, email: string): void {
  req.session.regenerate((regenErr) => {
    if (regenErr !== null && regenErr !== undefined) {
      devError(`Session regenerate failed: ${regenErr instanceof Error ? regenErr.message : String(regenErr)}`);
      testEnvRenderLoginError(res, 'An error occurred during sign-in. Please try again.');
      return;
    }

    const expiresAt = Date.now() + TEST_TOKEN_LIFETIME_MS;

    req.session.silasAuth = {
      accessToken: 'test-access-token',
      idToken: 'test-id-token',
      expiresAt,
      scopes: ['test.scope'],
      oboAccessToken: 'test-obo-access-token',
      oboExpiresAt: expiresAt,
    };

    req.session.user = {
      email,
      name: 'Playwright Test User',
      oid: 'test-oid',
    };

    req.session.save((saveErr) => {
      if (saveErr !== null && saveErr !== undefined) {
        devError(`Session save failed: ${saveErr instanceof Error ? saveErr.message : String(saveErr)}`);
        testEnvRenderLoginError(res, 'An error occurred during sign-in. Please try again.');
        return;
      }

      res.redirect(LOGIN_REDIRECT_TARGET);
    });
  });
}

export function testEnvStartTestEnvLogin(req: Request, res: Response): void {
  void req;
  testEnvRenderTestLoginPage(res);
}

export function testEnvHandleTestEnvLoginSubmit(req: Request, res: Response): void {
  const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
  const password = typeof req.body.password === 'string' ? req.body.password.trim() : '';

  const usernameError = username === '' ? 'Enter your username' : undefined;
  const passwordError = password === '' ? 'Enter your password' : undefined;

  if (usernameError !== undefined || passwordError !== undefined) {
    testEnvRenderTestLoginPage(res, { username }, { username: usernameError, password: passwordError });
    return;
  }

  testEnvCreateTestSession(req, res, username);
}

export function testEnvHandleSilasLogoutTestEnv(req: Request, res: Response): void {
  req.session.destroy((err) => {
    if (err !== null && err !== undefined) {
      devError(`Error destroying session: ${err instanceof Error ? err.message : String(err)}`);
    }

    res.redirect('/login');
  });
}
