import type { Request, Response, NextFunction } from 'express';
import { devLog, devError } from '#src/scripts/helpers/index.js';
import type { AuthCredentials } from '#types/auth-types.js';
import { authenticateUser } from '#src/services/authService.js';
import '#src/scripts/helpers/sessionHelpers.js';
import config from '#config.js';
import { validationResult, matchedData } from 'express-validator';
import { formatValidationError } from '#src/scripts/helpers/ValidationErrorHelpers.js';
import { encrypt } from '#src/utils/encryption.js';

// HTTP Status codes
const BAD_REQUEST = 400;
const NOT_EMPTY = 0;

interface LoginErrorDetails {
  inputErrors?: Record<string, string>;
  errorSummaryList?: Array<{ text: string; href?: string }>;
  authMessage?: string;
}

/**
 * Helper builds the error block for the viewModel or returns undefined if no errors
 * @param {LoginErrorDetails | undefined} error - Error details from authentication/validation.
 * @returns {{ inputErrors?: Record<string, string>; errorSummaryList: Array<{ text: string; href?: string }> } | undefined} - Returns error block or undefined
 */
function buildLoginErrorBlock(error?: LoginErrorDetails): { inputErrors?: Record<string, string>; errorSummaryList: Array<{ text: string; href?: string }> } | undefined {
  if (error === undefined) {
    return undefined;
  }

  const summaryBase = error.errorSummaryList ?? [];
  const auth = typeof error.authMessage === 'string' ? error.authMessage.trim() : '';
  const summary = auth !== '' ? [{ text: auth }, ...summaryBase] : summaryBase;

  const inputErrors = error.inputErrors ?? {};
  const hasSummary = summary.length > NOT_EMPTY;
  const hasInputErrors = Object.keys(inputErrors).length > NOT_EMPTY;

  if (!hasSummary && !hasInputErrors) return undefined;

  return {
    ...(hasInputErrors ? { inputErrors } : {}),
    errorSummaryList: summary
  };
}

/**
 * Render login page with error
 * @param {Response} res Express response object
 * @param {object} [error] - Error container to render.
 * @param {object} [values] - Initial form values.
 * @param {string} [values.username] - Pre-populated username.
 */
function renderLoginPage(res: Response, error?: LoginErrorDetails, values?: { username?: string } ): void {
  const viewModel: Record<string, unknown> = {
    title: 'Login',
    values
  };

  const errorBlock = buildLoginErrorBlock(error);
  viewModel.error = errorBlock;

  res.render('login/index.njk', viewModel);
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

    // Attempt authentication
    const { username, password } = matchedData<AuthCredentials>(req);
    const authResult = await authenticateUser(username, password);

    // Unsuccessful authentication
    if (!authResult.success) {
      const authMsg = authResult.error ?? '';
      renderLoginPage(
        res,
        {
          errorSummaryList: [
            { text: authMsg, href: '#' }
          ]
        },
        { username }
      );
      devLog(`rendering login with error: ${authMsg}`);
      return;
    }

    // Successful authentication
    if (authResult.authService !== undefined) {
      // Get the token to ensure it's cached in the service
      const accessToken = await authResult.authService.getAccessToken();

      // Store token information and minimal credentials for token refresh
      const userInfo = authResult.authService.getUserInfo();

      req.session.regenerate((regenErr) => {
        if (regenErr !== null) {
          devError(`Session regenerate failed: ${regenErr instanceof Error ? regenErr.message : String(regenErr)}`);
          renderLoginPage(res, { authMessage: 'An error occurred during login. Please try again.' }, { username });
          return;
        }

        req.session.authTokens = {
          accessToken,
          username,
          loginTime: Date.now()
        };

        // Store credentials with encrypted sensitive fields
        req.session.authCredentials = {
          username,
          password: encrypt(password), // Encrypted password
          client_id: config.api.auth.clientId,
          client_secret: encrypt(config.api.auth.clientSecret) // Encrypted client secret
        };

        if (userInfo !== null) {
          req.session.user = userInfo;
        }

        req.session.save((saveErr) => {
          if (saveErr !== null) {
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
