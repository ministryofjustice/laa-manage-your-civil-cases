import type { Request, Response, NextFunction } from 'express';
import { devLog, devError } from '#src/scripts/helpers/index.js';
import { safeBodyString, hasProperty, safeString } from '#src/scripts/helpers/dataTransformers.js';
import type { AuthCredentials } from '#types/auth-types.js';
import { createAuthServiceWithCredentials, type AuthService } from '#src/services/authService.js';
import '#src/scripts/helpers/sessionHelpers.js';
import config from '#config.js';

/**
 * Render login page with error
 * @param {Response} res Express response object
 * @param {string | null} error Error message to display or null
 */
function renderLoginPage(res: Response, error: string | null): void {
  res.render('login/index.njk', {
    title: 'Login',
    error
  });
}

/**
 * Validate and extract credentials from request body
 * @param {unknown} body Request body to validate
 * @returns {{ valid: false; error: string } | { valid: true; username: string; password: string }} Validation result
 */
function extractCredentials(body: unknown): { valid: false; error: string } | { valid: true; username: string; password: string } {
  // Use existing helper to check if body is a valid object
  if (!hasProperty(body, 'username') || !hasProperty(body, 'password')) {
    return { valid: false, error: 'Invalid request data' };
  }

  // Use existing helper to safely extract and convert to string
  const username = safeString(safeBodyString(body, 'username')).trim();
  const password = safeString(safeBodyString(body, 'password')).trim();

  if (username === '') {
    return { valid: false, error: 'Username is required' };
  }

  if (password === '') {
    return { valid: false, error: 'Password is required' };
  }

  return {
    valid: true,
    username,
    password
  };
}

/**
 * Attempt authentication with provided credentials
 * @param {string} username Username to authenticate
 * @param {string} password Password to authenticate
 * @returns {Promise<{ success: boolean; error?: string; authService?: AuthService }>} Authentication result with authService if successful
 */
async function authenticateUser(username: string, password: string): Promise<{ success: boolean; error?: string; authService?: AuthService }> {
  const credentials: AuthCredentials = {
    username,
    password,
    client_id: config.api.auth.clientId,
    client_secret: config.api.auth.clientSecret
  };

  const authService = createAuthServiceWithCredentials(credentials);

  if (authService === null) {
    devError('Failed to create auth service');
    return {
      success: false,
      error: 'Authentication service unavailable. Please try again later.'
    };
  }

  try {
    await authService.getAccessToken();
    devLog(`User ${username} authenticated successfully`);
    return { success: true, authService };
  } catch (error) {
    devError(`Login failed for user ${username}: ${error instanceof Error ? error.message : String(error)}`);
    return {
      success: false,
      error: 'Invalid username or password'
    };
  }
}

/**
 * GET: render login (or redirect if already logged in)
 * POST: validate, authenticate, set session, redirect (or re-render with error)
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} _next - Express next middleware function
 * @returns {Promise<void>} Promise that resolves when the request is processed
 */
export async function processLogin(req: Request, res: Response, _next: NextFunction): Promise<void> {
  // Already logged in?
  if (req.session.authCredentials !== undefined) {
    res.redirect('/cases/new');
    return;
  }

  // GET login page
  if (req.method === 'GET') {
    renderLoginPage(res, null);
    return;
  }

  // POST
  if (req.method === 'POST') {
    try {
      // Extract and validate credentials
      const credentialsResult = extractCredentials(req.body);
      if (!credentialsResult.valid) {
        renderLoginPage(res, credentialsResult.error);
        return;
      }

      const { username, password } = credentialsResult;

      // Attempt authentication
      const authResult = await authenticateUser(username, password);

      if (!authResult.success) {
        renderLoginPage(res, authResult.error ?? 'Authentication failed');
        return;
      }

      if (authResult.authService !== undefined) {
        // Get the token to ensure it's cached in the service
        const accessToken = await authResult.authService.getAccessToken();

        // Store token information and minimal credentials for token refresh
        const userInfo = authResult.authService.getUserInfo();

        req.session.regenerate((regenErr) => {
          if (regenErr != null) {
            devError(`Session regenerate failed: ${regenErr instanceof Error ? regenErr.message : String(regenErr)}`);
            renderLoginPage(res, 'An error occurred during login. Please try again.');
            return;
          }

          req.session.authTokens = {
            accessToken,
            username, // Keep username for e-mail in header
            loginTime: Date.now()
          };

          // Store only the credentials needed to recreate AuthService (still in session but at least not in plain sight)
          req.session.authCredentials = {
            username,
            password, // Note: This is still a security concern, but needed for token refresh
            client_id: config.api.auth.clientId,
            client_secret: config.api.auth.clientSecret
          };

          if (userInfo !== null) {
            req.session.user = userInfo;
          }

          req.session.save((saveErr) => {
            if (saveErr != null) {
              devError(`Session save failed: ${saveErr instanceof Error ? saveErr.message : String(saveErr)}`);
              renderLoginPage(res, 'An error occurred during login. Please try again.');
              return;
            }

            devLog(`User ${username} logged in successfully`);
            res.redirect('/cases/new');
          });
        });
        
        return;
      }
      renderLoginPage(res, 'Authentication failed');
    } catch (error) {
      devError(`Login error: ${error instanceof Error ? error.message : String(error)}`);
      renderLoginPage(res, 'An error occurred during login. Please try again.');
    }
  }
};

/**
 * Clears session and redirect to login page
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export function processLogout(req: Request, res: Response): void {
  req.session.destroy((err) => {
    if (err !== null && err !== undefined) {
      devError(`Error destroying session: ${err instanceof Error ? err.message : String(err)}`);
    }
    res.redirect('/login');
  });
}
