import type { Request, Response, NextFunction } from 'express';
import { createHmac } from 'node:crypto';
import '#src/scripts/helpers/sessionHelpers.js';
import config from '#config.js';

/**
 * Create a stable pseudonym identifier for Clarity from a raw user OID
 * @param {string | undefined} userOid - Raw user OID from identity provider.
 * @returns {string | null} Stable pseudonymous identifier, or null when unavailable.
 */
function getClarityUserId(userOid: string | undefined): string | null {
  if (userOid === undefined || userOid === '') {
    return null;
  }
  return createHmac('sha256', config.session.secret).update(userOid).digest('hex');
}

/**
 * Authentication middleware to check if user is logged in
 * Redirects to Entra login page if no valid SiLAS session token is found or the token is expired
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next function
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const silasAuth = req.session.silasAuth;
  const hasValidToken = silasAuth !== undefined && silasAuth.expiresAt > Date.now();

  if (!hasValidToken) {
    // User is not authenticated - redirect to Entra login
    res.redirect('/auth');
    return;
  }
  // User is authenticated - proceed to route handler
  next();
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
  res.locals.isAuthenticated = silasAuth !== undefined && silasAuth.expiresAt > Date.now();
  res.locals.userEmail = req.session.user?.email ?? null;
  res.locals.userName = req.session.user?.name ?? null;
  res.locals.clarityUserId = getClarityUserId(req.session.user?.oid);
  next();
};
