import type { Request, Response, NextFunction } from 'express';
import { devLog, devError } from '#src/scripts/helpers/index.js';
import { safeBodyString, hasProperty, safeString } from '#src/scripts/helpers/dataTransformers.js';
import type { AuthCredentials } from '#types/auth-types.js';
import { createAuthServiceWithCredentials, type AuthService } from '#src/services/authService.js';

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
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>} Promise that resolves when the request is processed
 */
export async function processLogin(req: Request, res: Response, _next: NextFunction): Promise<void> {
  // Already logged in?
  if (req.session.authCredentials !== undefined) {
    res.redirect('/cases/new');
    return;
  }

  if (req.method === 'GET') {
    renderLoginPage(res, null);
    return;
  }

  // POST
  try {
    const credentialsResult = extractCredentials(req.body);
    if (!credentialsResult.valid) {
      renderLoginPage(res, credentialsResult.error);
      return;
    }

    const { username, password } = credentialsResult;
    const authResult = await authenticateUser(username, password);

    if (!authResult.success) {
      renderLoginPage(res, authResult.error ?? 'Authentication failed');
      return;
    }

    if (authResult.authService !== undefined) {
      const accessToken = await authResult.authService.getAccessToken();
      const userInfo = authResult.authService.getUserInfo();

      if (userInfo !== null) {
        req.session.user = userInfo;
        req.session.authTokens = {
          accessToken,
          username,
          loginTime: Date.now()
        };

        // Store only the credentials needed to recreate AuthService (still in session but at least not in plain sight)
        req.session.authCredentials = {
          username,
          password, // Note: This is still a security concern, but needed for token refresh
          client_id: config.api.auth.clientId,
          client_secret: config.api.auth.clientSecret
        };
      }
    }

    devLog(`User ${req.body?.username ?? 'unknown'} logged in successfully`);
    res.redirect('/cases/new');
  } catch (error) {
    devError(`Login error: ${error instanceof Error ? error.message : String(error)}`);
    renderLoginPage(res, 'An error occurred during login. Please try again.');
  }
}

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

