import express from 'express';
import type { Request, Response } from 'express';
import { devLog, devError } from '#src/scripts/helpers/index.js';
import { safeBodyString, hasProperty, safeString } from '#src/scripts/helpers/dataTransformers.js';
import type { AuthCredentials } from '#types/auth-types.js';
import { createAuthServiceWithCredentials, type AuthService } from '#src/services/authService.js';
import '#src/scripts/helpers/sessionHelpers.js'; // Import session types
import config from '#config.js';

const router = express.Router();

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
 * GET /login - Display login page
 */
router.get('/', function (req: Request, res: Response): void {
  // Check if already logged in
  if (req.session.authTokens !== undefined) {
    res.redirect('/cases/new');
    return;
  }

  renderLoginPage(res, null);
});

/**
 * POST /login - Handle login form submission
 */
router.post('/', async function (req: Request, res: Response): Promise<void> {
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

    // Success - store tokens and auth service instead of credentials for security
    if (authResult.authService !== undefined) {
      // Get the token to ensure it's cached in the service
      const accessToken = await authResult.authService.getAccessToken();
      
      // Store token information in session (more secure than storing credentials)
      const userInfo = authResult.authService.getUserInfo();
      if (userInfo !== null) {
        const { authService } = authResult;
        req.session.user = userInfo;
        req.session.authTokens = {
          accessToken,
          username, // Keep username for session identification
          loginTime: Date.now() // Track when user logged in
        };
        // Store the AuthService instance which handles token refresh internally
        req.session.authService = authService;
      }
    }
    
    devLog(`User ${username} logged in successfully`);
    
    // Redirect to cases page
    res.redirect('/cases/new');
  } catch (error) {
    devError(`Login error: ${error instanceof Error ? error.message : String(error)}`);
    renderLoginPage(res, 'An error occurred during login. Please try again.');
  }
});

/**
 * GET /logout - Clear session and redirect to login
 */
router.get('/logout', function (req: Request, res: Response): void {
  req.session.destroy((err) => {
    if (err !== null && err !== undefined) {
      devError(`Error destroying session: ${err instanceof Error ? err.message : String(err)}`);
    }
    res.redirect('/login');
  });
});

export default router;
