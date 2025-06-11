import { create } from 'middleware-axios';
import type { Request, Response, NextFunction } from 'express';
import type { AxiosInstanceWrapper } from '#types/axios-instance-wrapper.js';

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
 * Axios middleware to attach Axios instance to request object.
 *
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The next middleware function in the stack.
 * @returns {void}
 */
export const axiosMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const protocol = req.protocol;
  const host = req.get('host');
  const baseURL = `${protocol}://${host}`;

  // Create wrapped instance of axios to use normal axios instance
  req.axiosMiddleware = create({
    baseURL,
    timeout: 5000, // Set a timeout value if needed
    headers: {
      'Content-Type': 'application/json'
      // You can add other default headers here if needed
    }
  });
  next();
};
