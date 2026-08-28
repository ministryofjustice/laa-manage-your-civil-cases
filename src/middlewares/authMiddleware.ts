import type { Request, Response, NextFunction } from 'express';
import '#src/scripts/helpers/sessionHelpers.js';
import { devError } from '#src/scripts/helpers/index.js';
import { refreshSilasToken } from '#src/services/silasAuthService.js';

/**
 * Attempts to silently renew an expired SiLAS access token using the cached refresh token.
 * @param {Request} req Express request object
 * @returns {Promise<boolean>} True if the session now holds a valid access token.
 */
async function tryRefreshSilasAuth(req: Request): Promise<boolean> {
  const silasAuth = req.session.silasAuth;
  if (silasAuth?.tokenCache === undefined) {
    return false;
  }

  const refreshed = await refreshSilasToken(silasAuth.tokenCache);
  if (refreshed === null) {
    return false;
  }

  req.session.silasAuth = {
    ...silasAuth,
    accessToken: refreshed.accessToken,
    expiresAt: refreshed.expiresAt,
    tokenCache: refreshed.tokenCache,
  };
  return true;
}

/**
 * Authentication middleware to check if user is logged in
 * Redirects to Entra login page if no valid SiLAS session token is found or the token is expired
 * and can't be silently refreshed
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next function
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const silasAuth = req.session.silasAuth;
  const hasValidToken = silasAuth !== undefined && silasAuth.expiresAt > Date.now();

  if (hasValidToken) {
    next();
    return;
  }

  try {
    if (silasAuth !== undefined && await tryRefreshSilasAuth(req)) {
      next();
      return;
    }
  } catch (error) {
    devError(`Unexpected error during SILAS token refresh: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (silasAuth !== undefined) {
    req.session.sessionExpiredNotice = true;
  }

  res.redirect('/auth');
}

/**
 * Middleware to set authentication status in response locals
 * This makes isAuthenticated available to all templates
 *
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const setAuthStatus = (req: Request, res: Response, next: NextFunction): void => {
  const silasAuth = req.session.silasAuth;
  const isAuthenticated = silasAuth !== undefined && silasAuth.expiresAt > Date.now();
  res.locals.isAuthenticated = isAuthenticated;
  res.locals.userEmail = req.session.user?.email ?? null;
  res.locals.userName = req.session.user?.name ?? null;
  res.locals.sessionExpiredNotice = isAuthenticated && req.session.sessionExpiredNotice === true;

  if (isAuthenticated) {
    delete req.session.sessionExpiredNotice;
  }

  next();
};
