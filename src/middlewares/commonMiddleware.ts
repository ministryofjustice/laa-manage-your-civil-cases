import type { Application } from 'express';
import express from 'express';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import config from '#config.js';
import morgan from 'morgan';
import session from 'express-session';
import { buildSessionConfig } from '#utils/server/session.js';
import { axiosMiddleware } from '#utils/server/index.js';

/**
 * Sets up common middlewares for the given Express application.
 *
 * @param {Application} app - The Express application instance.
 * @returns {Promise<void>} Sets up various middleware on the provided app instance.
 */
export const setupMiddlewares = async (app: Application): Promise<void> => {
	// Set up request logging based on environment
	if (process.env.NODE_ENV === 'production') {
		// Use combined format for production (more structured, less verbose)
		app.use(morgan('combined'));
	} else {
		// Use dev format for development (colored, more readable)
		app.use(morgan('dev'));
	}

  // Serve static files from the specified public directory
  app.use(express.static(config.paths.static));

  // Parses cookies and adds them to req.cookies
  app.use(cookieParser());

  // Parses JSON request bodies
  app.use(express.json());

  // Parses URL-encoded bodies
  app.use(express.urlencoded({ extended: false }));
};
