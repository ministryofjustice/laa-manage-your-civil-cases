/**
 * Sets up Helmet middleware for the Express application to configure Content Security Policy (CSP).
 *
 * @param {import('express').Application} app - The Express application instance.
 */
import helmet from 'helmet';
import crypto from 'crypto';
import type { Request, Response, NextFunction, Application } from 'express';

/**
 * Middleware to generate a unique CSP nonce for each request.
 *
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next function.
 */
export const nonceMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  res.locals.cspNonce = crypto.randomBytes(16).toString('base64'); // Generate a secure random nonce
  next();
};

/**
 * Sets up Helmet's Content Security Policy (CSP) with a dynamic nonce.
 *
 * @param {Application} app - The Express application instance.
 */
export const helmetSetup = (app: Application): void => {
  app.use(nonceMiddleware); // Apply nonce middleware before Helmet

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            // Use type casting to make TypeScript happy with the function in the array
            ((req: Request, res: Response) => `'nonce-${res.locals.cspNonce}'`) as unknown as string
          ],
          styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles if needed
          fontSrc: ["'self'", "data:"], // Allow data: URIs for fonts
          imgSrc: ["'self'", "data:"], // Allow data: URIs for images
          connectSrc: ["'self'"],
          objectSrc: ["'none'"], // Restrict <object>, <embed>, and <applet> elements
          mediaSrc: ["'self'"], // Restrict media
          frameSrc: ["'none'"], // Restrict frames
          formAction: ["'self'"], // Restrict form submissions
          baseUri: ["'self'"], // Restrict base URI
          upgradeInsecureRequests: [], // Upgrade HTTP to HTTPS
        }
      }
    })
  );
};
