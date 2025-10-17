import type { Request, Response, NextFunction } from 'express';
import { devLog, devError } from '#src/scripts/helpers/index.js';
import type { AuthCredentials } from '#types/auth-types.js';
import { createAuthServiceWithCredentials, type AuthService } from '#src/services/authService.js';
import '#src/scripts/helpers/sessionHelpers.js';
import config from '#config.js';
import { validationResult, matchedData } from 'express-validator';
import { formatValidationError } from '#src/scripts/helpers/ValidationErrorHelpers.js';

// HTTP Status codes
const BAD_REQUEST = 400;
const NOT_EMPTY = 0;

/**
 * Render login page with error
 * @param {Response} res Express response object
 * @param {object} [error] - Error container to render.
 * @param {<string,string>} [error.inputErrors] - Field with inline error text.
 * @param {{text:string, href?:string}[]} [error.errorSummaryList] - GOV.UK error summary items.
 * @param {string} [error.authMessage] - Auth message (e.g. Authentication service unavailable. Please try again later.).
 * @param {object} [values] - Initial form values.
 * @param {string} [values.username] - Pre-populated username.
 */
function renderLoginPage(res: Response, error?: { inputErrors?: Record<string, string>; errorSummaryList?: Array<{ text: string; href?: string }>; authMessage?: string;}, values?: { username?: string }): void {
  const summaryBase = error?.errorSummaryList ?? [];
  const auth = typeof error?.authMessage === 'string' ? error.authMessage.trim() : '';
  const summary = auth !== '' ? [{ text: auth }, ...summaryBase] : summaryBase;

  const inputErrors = error?.inputErrors ?? {};

  const viewModel: Record<string, unknown> = {
    title: 'Login',
    values
  };

  // Decide whether to include the `error` block at all
  const hasSummary = summary.length > NOT_EMPTY;
  const hasInputErrors = Object.keys(inputErrors).length > NOT_EMPTY;

  if (hasSummary || hasInputErrors) {
    viewModel.error = {
      ...(hasInputErrors ? { inputErrors } : {}),
      errorSummaryList: summary
    };
  }
  res.render('login/index.njk', viewModel);
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
      error: 'Email or password is incorrect'
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
    renderLoginPage(res);
    return;
  }

  // POST
  if (req.method === 'POST') {
    try {
      // Handle validation errors first
      const validationErrors = validationResult(req);
      if (!validationErrors.isEmpty()) {
        const rawErrors = validationErrors.array({ onlyFirstError: false });

        const errors = rawErrors.map((error) => {
          const field = 'path' in error && typeof error.path === 'string' ? error.path : '';
          const { inlineMessage = '', summaryMessage } = formatValidationError(error);
          return { field, inlineMessage, summaryMessage };
        });

        const inputErrors = errors.reduce<Record<string, string>>((acc, { field, inlineMessage }) => {
          const inline = inlineMessage.trim();
          acc[field] = inline;
          return acc;
        }, {});

        // Map fields to their input IDs for summary links
        const fieldIdMap: Record<string, string> = {
          username: 'username',
          password: 'password',
        };

        // Build the GOV.UK error summary list with field-specific anchors
        const errorSummaryList = errors.map(({ field, summaryMessage }) => ({
          text: summaryMessage,
          href: `#${fieldIdMap[field] ?? field}`,
        }));

        const formValues = matchedData<AuthCredentials>(req, { locations: ['body'], onlyValidData: false });

        res.status(BAD_REQUEST).render('login/index.njk', {
          error: {
            inputErrors,
            errorSummaryList
          },
          values: {
            username: formValues.username
          },
          request: req
        });
        return;
      }

      const { username, password } = matchedData<AuthCredentials>(req);

      // Attempt authentication
      const authResult = await authenticateUser(username, password);

      if (!authResult.success) {
        renderLoginPage(res, { authMessage: authResult.error }, { username });
        devLog(`rendering login with error: ${authResult.error}`);
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
            renderLoginPage(res, { authMessage: 'An error occurred during login. Please try again.' }, { username });
            return;
          }

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

          if (userInfo !== null) {
            req.session.user = userInfo;
          }

          req.session.save((saveErr) => {
            if (saveErr != null) {
              devError(`Session save failed: ${saveErr instanceof Error ? saveErr.message : String(saveErr)}`);
              renderLoginPage(res, { authMessage: 'An error occurred during login. Please try again.' }, { username });
              return;
            }

            devLog(`User ${username} logged in successfully`);
            res.redirect('/cases/new');
          });
        });

        return;
      }
      renderLoginPage(res, { authMessage: authResult.error ?? 'Authentication failed' }, { username });
    } catch (error) {
      devError(`Login error: ${error instanceof Error ? error.message : String(error)}`);
      renderLoginPage( res,{ authMessage: 'An error occurred during login. Please try again.' });
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
