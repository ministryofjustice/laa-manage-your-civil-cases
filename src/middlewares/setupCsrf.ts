import { csrfSync } from "csrf-sync";
import type { Application, Request, Response, NextFunction } from 'express';
// Import CSRF token type definitions
import '#types/csrf-types.js';
import config from '#config.js';
import { isDevelopment, devLog } from '#src/scripts/helpers/index.js';

/**
 * Type guard to check if an object has a _csrf property
 * @param {unknown} body - The request body to check
 * @returns {boolean} True if body has _csrf property
 */
const hasCSRFToken = (body: unknown): body is { _csrf: unknown } =>
  body !== null &&
  body !== undefined &&
  typeof body === 'object' &&
  '_csrf' in body;

/**
 * Validates the Origin or Referer header against the host.
 * OWASP recommends this as defense-in-depth for CSRF protection.
 *
 * @param {Request} req - The incoming request object.
 * @returns {boolean} True if the origin/referer is valid, false otherwise.
 */
const validateOriginHeader = (req: Request): boolean => {
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const host = req.headers.host;

  // If no origin or referer, allow (will be caught by token validation)
  // This is common for same-origin requests in some browsers
  if (!origin && !referer) {
    return true;
  }

  // Check if we're in test or development environment
  const isTestOrDev = isDevelopment() || process.env.NODE_ENV === 'test';

  try {
    // Check origin header first
    if (origin) {
      const originUrl = new URL(origin);
      const originHost = originUrl.host;

      // Exact match
      if (originHost === host) {
        return true;
      }

      // In development/test, allow localhost variations (with/without port)
      if (isTestOrDev && host && originHost) {
        const hostBase = host.split(':')[0];
        const originBase = originHost.split(':')[0];
        if (hostBase === originBase && (hostBase === 'localhost' || hostBase === '127.0.0.1')) {
          return true;
        }
      }

      return false;
    }

    // Fall back to referer header
    if (referer) {
      const refererUrl = new URL(referer);
      const refererHost = refererUrl.host;

      // Exact match
      if (refererHost === host) {
        return true;
      }

      // In development/test, allow localhost variations
      if (isTestOrDev && host && refererHost) {
        const hostBase = host.split(':')[0];
        const refererBase = refererHost.split(':')[0];
        if (hostBase === refererBase && (hostBase === 'localhost' || hostBase === '127.0.0.1')) {
          return true;
        }
      }

      return false;
    }
  } catch {
    // Invalid URL format - reject in production, allow in development/test
    return isTestOrDev;
  }

  return true;
};

/**
 * Sets up CSRF protection for an Express application following OWASP guidelines.
 *
 * OWASP CSRF Prevention Cheat Sheet compliance:
 * ✓ Synchronizer Token Pattern using cryptographically strong random tokens (csrf-sync)
 * ✓ Token validation on state-changing operations (POST, PUT, DELETE, PATCH)
 * ✓ Safe methods excluded from CSRF validation (GET, HEAD, OPTIONS)
 * ✓ Tokens checked from multiple sources (headers and request body)
 * ✓ Defense-in-depth with Origin/Referer header validation
 * ✓ Session cookies configured with secure attributes (see config.ts):
 *   - httpOnly: Prevents XSS attacks from accessing cookies
 *   - secure: HTTPS-only transmission in production
 *   - sameSite: 'strict' - Prevents cross-site request forgery
 * ✓ CSRF cookies managed by csrf-sync with secure defaults
 *
 * @param {Application} app - The Express application instance.
 */
export const setupCsrf = (app: Application): void => {
  // csrf-sync uses 128-bit cryptographically strong tokens by default (OWASP compliant)
  const { csrfSynchronisedProtection } = csrfSync({
    /**
     * Extracts the CSRF token from the request body or headers.
     * OWASP recommends checking multiple sources for flexibility.
     *
     * @param {Request} req - The incoming request object.
     * @returns {string|undefined} The CSRF token if present, otherwise undefined.
     */
    getTokenFromRequest: (req: Request): string | undefined => {
      // Check headers first (for AJAX requests) - OWASP recommended
      const headerToken = req.headers['x-csrf-token'] || req.headers['csrf-token'];
      if (typeof headerToken === 'string') {
        return headerToken;
      }

      // Fall back to checking request body (for form submissions)
      if (hasCSRFToken(req.body)) {
        return typeof req.body._csrf === 'string' ? req.body._csrf : undefined;
      }
      return undefined;
    },
    /**
     * Ignore CSRF validation for safe HTTP methods per OWASP guidelines.
     * GET, HEAD, and OPTIONS should not have side effects (idempotent).
     */
    ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  });

  /**
   * Defense-in-depth: Validate Origin/Referer headers before CSRF token check.
   * This is an additional security layer recommended by OWASP.
   */
  app.use((req: Request, res: Response, next: NextFunction): void => {
    // Only validate for state-changing methods
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      // Debug logging in development
      devLog(`[CSRF Debug] ${JSON.stringify({
        method: req.method,
        path: req.path,
        origin: req.headers.origin,
        referer: req.headers.referer,
        host: req.headers.host
      })}`);

      if (!validateOriginHeader(req)) {
        console.error('[CSRF] Origin validation failed:', {
          origin: req.headers.origin,
          referer: req.headers.referer,
          host: req.headers.host
        });
        res.status(403).render('main/error', {
          status: '403 - Forbidden',
          error: 'Invalid origin or referer header. Cross-site requests are not allowed.'
        });
        return;
      }
    }
    next();
  });

  /**
   * Middleware to enforce CSRF protection on incoming requests.
   * This applies the `csrfSynchronisedProtection` middleware globally.
   */
  app.use(csrfSynchronisedProtection);

  /**
   * Error handler for CSRF token validation failures.
   * Catches ForbiddenError thrown by csrf-sync and renders error page.
   */
  app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
    if (err.name === 'ForbiddenError' || err.message?.includes('csrf')) {
      console.error('[CSRF] Token validation failed:', {
        path: req.path,
        method: req.method,
        error: err.message
      });
      res.status(403).render('main/error', {
        status: '403 - Forbidden',
        error: 'Invalid or missing CSRF token. Please refresh the page and try again.'
      });
      return;
    }
    next(err);
  });

  /**
   * Middleware to expose the CSRF token to views.
   * Adds `res.locals.csrfToken`, making it accessible in templates.
   *
   * @param {Request} req - The incoming request object.
   * @param {Response} res - The response object.
   * @param {NextFunction} next - Callback to pass control to the next middleware.
   */
  app.use((req: Request, res: Response, next: NextFunction): void => {
    if (typeof req.csrfToken === "function") {
      res.locals.csrfToken = req.csrfToken(); // Makes CSRF token available in views
    }
    next();
  });
};
