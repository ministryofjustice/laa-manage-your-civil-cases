import rateLimit from 'express-rate-limit';
import type { Application } from 'express';
import type { Config } from '#types/config-types.js';
import { HTTP } from '#src/services/api/base/constants.js';

/**
 * Sets up rate limiting for the given Express app.
 *
 * @param {Application} app - The Express app instance.
 * @param {Config} config - The configuration object containing rate limiting settings.
 */
export const rateLimitSetUp = (app: Application, config: Config): void => {
  // Skip rate limiting in test environment to prevent 429 errors during E2E test suites
  if (process.env.NODE_ENV === 'test' || process.env.SKIP_RATE_LIMIT === 'true') {
    console.log('🚫 Rate limiting disabled for test environment');
    return;
  }

  /**
   * Rate limiter for general routes.
   * Limits each IP to a configurable number of requests per time window.
   */
  const generalLimiter = rateLimit({
    windowMs: typeof config.RATE_WINDOW_MS === 'string' ? parseInt(config.RATE_WINDOW_MS, 10) : config.RATE_WINDOW_MS,
    max: typeof config.RATE_LIMIT_MAX === 'string' ? parseInt(config.RATE_LIMIT_MAX, 10) : config.RATE_LIMIT_MAX,
    /**
     * Handles rate-limited requests, and show message when limit reached
     * @param {Request} _req - Express request object
     * @param {Response} res - Express response object used to send the 429 response
     * @returns {void} Renders the `main/error.njk` template with rate-limit details
     */
    handler: (_req, res) => {      
      res.status(HTTP.TOO_MANY_REQUESTS).render('main/error.njk', {
        status: HTTP.TOO_MANY_REQUESTS,
        error: "You have made too many requests. Please wait 5 minutes before trying again."
      });
    }
  });

  // Apply the general rate limiter to all requests
  app.use(generalLimiter);
};
