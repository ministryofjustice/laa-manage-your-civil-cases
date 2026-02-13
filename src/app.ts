import dotenv from 'dotenv';
// Load environment variables before any other imports
dotenv.config();

import type { Request, Response } from 'express';
import express from 'express';
import chalk from 'chalk';
import morgan from 'morgan';
import compression from 'compression';
import { createServer } from 'http';
import { setupCsrf, setupMiddlewares, setupConfig, setupLocaleMiddleware, setAuthStatus } from '#src/middlewares/indexSetUp.js';
import session from 'express-session';
import { RedisStore } from 'connect-redis';
import { nunjucksSetup, rateLimitSetUp, helmetSetup, axiosMiddleware, displayAsciiBanner, createRedisClient, setupSocketIO, type RedisClientType } from '#utils/server/index.js';
import { initializeI18nextSync } from '#src/scripts/helpers/index.js';
import config from '#config.js';
import indexRouter from '#routes/index.js';
import livereload from 'connect-livereload';

const TRUST_FIRST_PROXY = 1;

// Store Redis client for Socket.IO
let globalRedisClient: RedisClientType | null = null;

/**
 * Creates and configures an Express application.
 * Then starts the server listening on the configured port.
 *
 * @returns {Promise<import('express').Application>} The configured Express application
 */
const createApp = async (): Promise<express.Application> => {
	// Initialize i18next synchronously before setting up the app
	initializeI18nextSync();
	
	const app = express();

	// Set up common middleware for handling cookies, body parsing, etc.
	setupMiddlewares(app);

	// Response compression setup
	app.use(compression({
		/**
		 * Custom filter for compression.
		 * Prevents compression if the 'x-no-compression' header is set in the request.
		 *
		 * @param {import('express').Request} req - The Express request object
		 * @param {import('express').Response} res - The Express response object
		 * @returns {boolean} True if compression should be applied, false otherwise
		 */
		filter: (req: Request, res: Response): boolean => {
			if ('x-no-compression' in req.headers) {
				return false;
			}
			return compression.filter(req, res);
		}
	}));

	// Set up security headers
	helmetSetup(app);

	// Reducing fingerprinting by removing the 'x-powered-by' header
	app.disable('x-powered-by');

	// Set up cookie security for sessions
	app.set('trust proxy', TRUST_FIRST_PROXY);

	// Configure session store (Redis if enabled, in-memory otherwise)
	const sessionConfig: session.SessionOptions = { ...config.session };

	if (config.redis.enabled) {
		try {
			const redisClient = await createRedisClient();
			globalRedisClient = redisClient; // Store for Socket.IO
			sessionConfig.store = new RedisStore({
				client: redisClient,
				prefix: 'laa-manage-your-civil-cases:',
				ttl: 86400 // 24 hours in seconds
			});
			console.log(chalk.green('✓ Using Redis session store'));
		} catch (error) {
			console.error(chalk.red('❌ Failed to connect to Redis, falling back to in-memory session store'));
			console.error(error);
		}
	} else {
		console.log(chalk.yellow('⚠️  Using in-memory session store (not suitable for production with multiple pods)'));
	}

	app.use(session(sessionConfig));

	// Set up authentication status for templates
	app.use(setAuthStatus);

  // Set up axios middleware AFTER session middleware so req.session is available
	app.use(axiosMiddleware);

	// Set up Cross-Site Request Forgery (CSRF) protection
	setupCsrf(app);

	// Set up locale middleware for internationalisation
	app.use(setupLocaleMiddleware);

	// Set up Nunjucks as the template engine
	nunjucksSetup(app);

	// Set up rate limiting
	rateLimitSetUp(app, config);

	// Set up application-specific configurations
	setupConfig(app);

	// Set up request logging based on environment
	if (process.env.NODE_ENV === 'production') {
		// Use combined format for production (more structured, less verbose)
		app.use(morgan('combined'));
	} else {
		// Use dev format for development (colored, more readable)
		app.use(morgan('dev'));
	}

	// Register the main router
	app.use('/', indexRouter);

	// Enable live-reload middleware in development mode
	if (process.env.NODE_ENV === 'development') {
		app.use(livereload());
	}

	// Display ASCII Art banner
	displayAsciiBanner(config);

	// Create HTTP server and attach Socket.IO
	const httpServer = createServer(app);

	// Set up Socket.IO if Redis is enabled
	if (config.redis.enabled && globalRedisClient) {
		try {
			await setupSocketIO(httpServer, globalRedisClient, config.redis.url);
			console.log(chalk.green('✓ Socket.IO real-time notifications enabled'));
		} catch (error) {
			console.error(chalk.red('❌ Failed to set up Socket.IO:'), error);
		}
	}

	// Starts the HTTP server on the configured port
	httpServer.listen(config.app.port, () => {
		console.log(chalk.yellow(`Listening on port ${config.app.port}...`));
	});

	return app;
};

// Self-execute the app directly to allow app.js to be executed directly
void createApp().catch((error) => {
	console.error(chalk.red('Failed to start application:'), error);
	process.exit(1);
});

// Export the createApp function for testing/import purposes
export default createApp;