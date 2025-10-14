import { create } from 'middleware-axios';
import type { Request, Response, NextFunction } from 'express';
import type { AxiosInstanceWrapper } from '#types/axios-instance-wrapper.js';
import type { InternalAxiosRequestConfig } from 'axios';
import { devLog, devError } from '#src/scripts/helpers/index.js';
import '#src/scripts/helpers/sessionHelpers.js'; // Import session types

const DEFAULT_TIMEOUT = 5000;
const HTTP_UNAUTHORIZED = 401;

// Extend Express Request to include our axiosMiddleware
declare global {
  namespace Express {
    interface Request {
      axiosMiddleware: AxiosInstanceWrapper;
    }
  }
}

// NOTE: This module exports axiosMiddleware

/**
 * Convert unknown error to Error instance
 * @param {unknown} error Error to convert
 * @returns {Error} Error instance
 */
function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

/**
 * Type guard for axios error with response
 * @param {unknown} error Error to check
 * @returns {boolean} True if error has response with status
 */
function isAxiosErrorWithResponse(error: unknown): error is { response: { status: number } } {
  return error !== null &&
         typeof error === 'object' &&
         'response' in error &&
         error.response !== null &&
         typeof error.response === 'object' &&
         'status' in error.response &&
         typeof (error.response as { status: unknown }).status === 'number';
}

/**
 * Axios middleware to attach Axios instance to request object.
 *
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The next middleware function in the stack.
 * @returns {void}
 */
export const axiosMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Create axios instance with default config
  const axiosWrapper = create({
    timeout: DEFAULT_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Get AuthService from session (login required)
  const authService = req.session.authService ?? null;
  
  // Check if user is authenticated via session
  if (authService !== null) {
    devLog('Using session-based AuthService for API requests');
  } else {
    devLog('No session AuthService found - user must login to access API');
  }

  // Add JWT authentication interceptor for API calls if user is authenticated
  if (authService !== null) {
    // Request interceptor for JWT auth
    axiosWrapper.axiosInstance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        try {
          config.headers.Authorization = await authService.getAuthHeader();
          devLog('Added JWT authorization header to API request');
        } catch (error) {
          devError(`Failed to add JWT authorization header: ${toError(error).message}`);
          // Continue without auth header - API will handle 401 response
        }
        return config;
      },
      async (error: unknown) => await Promise.reject(toError(error))
    );

    // Response interceptor for 401 error handling
    axiosWrapper.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: unknown) => {
        if (isAxiosErrorWithResponse(error) && error.response.status === HTTP_UNAUTHORIZED) {
          devError('API returned 401 Unauthorized - clearing cached tokens');
          authService.clearTokens();
          
          // If using session auth, clear session and redirect to login
          if (req.session.authTokens !== undefined) {
            req.session.destroy((destroyErr) => {
              if (destroyErr !== null && destroyErr !== undefined) {
                devError(`Error destroying session: ${destroyErr instanceof Error ? destroyErr.message : String(destroyErr)}`);
              }
            });
          }
        }
        return await Promise.reject(toError(error));
      }
    );
  }

  req.axiosMiddleware = axiosWrapper;
  next();
};
