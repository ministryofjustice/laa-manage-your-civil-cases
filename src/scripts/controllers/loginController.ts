import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { devError } from '#src/scripts/helpers/index.js';
import '#src/scripts/helpers/sessionHelpers.js';
import config from '#config.js';
import {
  getSilasLoginUrl,
  exchangeSilasCodeForToken,
  exchangeSilasTokenOnBehalfOf,
  getSilasLogoutUrl,
  verifySilasProviderIdentity,
  SilasIdentityMappingError,
} from '#src/services/silasAuthService.js';

// HTTP Status codes
const BAD_REQUEST = 400;
const LOGIN_REDIRECT_TARGET = '/cases/new';

function generateState(): string {
  return randomUUID();
}

function renderLoginError(res: Response, error: string, status = 500): void {
  res.status(status).render('main/error.njk', {
    status: String(status),
    error,
  });
}

export async function startSilasLogin(req: Request, res: Response): Promise<void> {
  const state = generateState();
  req.session.silasLoginState = state;

  try {
    const loginUrl = await getSilasLoginUrl(state);
    res.redirect(loginUrl);
  } catch (error) {
    devError(`Failed to create SILAS login URL: ${error instanceof Error ? error.message : String(error)}`);
    renderLoginError(res, 'Unable to start sign-in right now. Please try again.');
  }
}

export async function handleSilasCallback(req: Request, res: Response): Promise<void> {
  const code = typeof req.query.code === 'string' ? req.query.code : '';
  const state = typeof req.query.state === 'string' ? req.query.state : '';

  if (code === '' || state === '' || state !== req.session.silasLoginState) {
    renderLoginError(res, 'Invalid authentication callback.', BAD_REQUEST);
    return;
  }

  try {
    const silasToken = await exchangeSilasCodeForToken(code);
    const oboToken = await exchangeSilasTokenOnBehalfOf(silasToken.accessToken);
    await verifySilasProviderIdentity(oboToken.accessToken);

    req.session.regenerate((regenErr) => {
      if (regenErr !== null && regenErr !== undefined) {
        devError(`Session regenerate failed: ${regenErr instanceof Error ? regenErr.message : String(regenErr)}`);
        renderLoginError(res, 'An error occurred during sign-in. Please try again.');
        return;
      }

      req.session.silasAuth = {
        accessToken: silasToken.accessToken,
        idToken: silasToken.idToken,
        expiresAt: silasToken.expiresAt,
        scopes: config.silas.scopes,
        oboAccessToken: oboToken.accessToken,
        oboExpiresAt: oboToken.expiresAt,
      };

      req.session.user = {
        email: silasToken.email,
        name: silasToken.name,
        oid: silasToken.oid,
      };

      req.session.save((saveErr) => {
        if (saveErr !== null && saveErr !== undefined) {
          devError(`Session save failed: ${saveErr instanceof Error ? saveErr.message : String(saveErr)}`);
          renderLoginError(res, 'An error occurred during sign-in. Please try again.');
          return;
        }

        res.redirect(LOGIN_REDIRECT_TARGET);
      });
    });
  } catch (error) {
    devError(`SILAS callback error: ${error instanceof Error ? error.message : String(error)}`);

    if (error instanceof SilasIdentityMappingError) {
      renderLoginError(
        res,
        'Your account is authenticated but not linked to a provider profile in MCC yet. Please contact the MCC support team.',
        BAD_REQUEST
      );
      return;
    }

    renderLoginError(res, 'Unable to complete sign-in. Please try again.');
  }
}

export function handleSilasLogout(req: Request, res: Response): void {
  req.session.destroy((err) => {
    if (err !== null && err !== undefined) {
      devError(`Error destroying session: ${err instanceof Error ? err.message : String(err)}`);
    }

    res.redirect(getSilasLogoutUrl());
  });
}
