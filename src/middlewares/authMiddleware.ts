import type { Request, Response, NextFunction } from 'express';
import '#src/scripts/helpers/sessionHelpers.js';

/**
 * Authentication middleware to check if user is logged in
 * Redirects to login page if no SILAS session token is found or token is expired
 * 
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next function
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const silasAuth = req.session.silasAuth;
  const hasValidToken = silasAuth !== undefined && silasAuth.expiresAt > Date.now();

  if (!hasValidToken) {
    // User is not authenticated - redirect to login
    res.redirect('/login');
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
  next();
};
