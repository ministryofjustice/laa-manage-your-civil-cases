import type { Request, Response, NextFunction } from 'express';
import '#src/scripts/helpers/sessionHelpers.js'; // Import session types

/**
 * Authentication middleware to check if user is logged in
 * Redirects to login page if no session tokens are found
 *
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next function
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  // Check if user has auth tokens in session
  if (req.session.authTokens === undefined) {
    // User is not authenticated - redirect to login
    res.redirect('/login');
    return;
  }

  // User is authenticated - proceed to route handler
  next();
}
