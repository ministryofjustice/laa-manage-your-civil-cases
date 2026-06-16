// Ensure config is loaded before other imports that depend on it
import config from '#config.js';

import type { Request, Response } from 'express';
import express from 'express';
import chalk from 'chalk';
import morgan from 'morgan';
import compression from 'compression';
import { setupCsrf, setupMiddlewares, setupConfig, setupLocaleMiddleware, setAuthStatus } from '#src/middlewares/indexSetUp.js';
import { fetchClientDetails } from '#src/middlewares/caseDetailsMiddleware.js';
import session from 'express-session';
import { nunjucksSetup, rateLimitSetUp, helmetSetup, axiosMiddleware, displayAsciiBanner } from '#utils/server/index.js';
import { initializeI18nextSync } from '#src/scripts/helpers/index.js';
import indexRouter from '#routes/index.js';
import livereload from 'connect-livereload';
import { buildSessionConfig } from '#utils/server/session.js';

// Forge related packages and setup
import { Forge } from '@ministryofjustice/hmpps-forge/core';
import { ExpressFrameworkAdapter, nunjucksFunctions } from '@ministryofjustice/hmpps-forge/express-nunjucks';
import { govukComponents } from '@ministryofjustice/hmpps-forge/govuk-components'
import { mojComponents } from '@ministryofjustice/hmpps-forge/moj-components'
import createEligibilityPackage from '@ministryofjustice/financial-eligibility-journey';
import { apiService } from '#src/services/apiService.js';
import { type Deps } from '#packages/financial-eligibility-journey/src/api.js';
import { type AxiosInstanceWrapper } from '#types/axios-instance-wrapper.js';
import { FinancialEligibilityEffectsWithDepsImpl } from '#src/services/financialEligibilityWithDeps.js';

const TRUST_FIRST_PROXY = 1;


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
	
	app.use(session(await buildSessionConfig(config)));

	// Set up rate limiting
	rateLimitSetUp(app, config);
	
	// Set up authentication status for templates
	app.use(setAuthStatus);

  // Set up axios middleware AFTER session middleware so req.session is available
	app.use(axiosMiddleware);

	// Set up Cross-Site Request Forgery (CSRF) protection
	setupCsrf(app);

	// Set up locale middleware for internationalisation
	app.use(setupLocaleMiddleware);
	
	// Set up Nunjucks as the template engine
	const nunjucksEnv = nunjucksSetup(app);

	// Set up application-specific configurations
	setupConfig(app);

	// Set up Forge
	const forge = new Forge({
		frameworkAdapter: ExpressFrameworkAdapter.configure({ nunjucksEnv }),
	})

	forge
		.registerGlobalComponents(govukComponents)
		.registerGlobalComponents(mojComponents)
		.registerGlobalFunctions(nunjucksFunctions)
		.registerPackage<Deps>(createEligibilityPackage, {apiService, effectsWithDeps: new FinancialEligibilityEffectsWithDepsImpl()});

	// Set up request logging based on environment
	if (process.env.NODE_ENV === 'production') {
		// Use combined format for production (more structured, less verbose)
		app.use(morgan('combined'));
	} else {
		// Use dev format for development (coloured, more readable)
		app.use(morgan('dev'));
	}

	// Forge routes set-up
	app.use(express.urlencoded({ extended: true }));
	// Fetch client details for Forge journey routes
	app.use('/cases/:caseReference/financial-eligibility/change', fetchClientDetails);
	app.use('/', forge.getRouter() as express.Router);

	// Register the main router
	app.use('/', indexRouter);

	// Enable live-reload middleware in development mode
	if (process.env.NODE_ENV === 'development') {
		app.use(livereload());
	}

	// Display ASCII Art banner
	displayAsciiBanner(config);

	// Starts the Express server on the specified port
	app.listen(config.app.port, () => {
		console.log(chalk.yellow(`Listening on port ${config.app.port}...`));
	});

	return app;
};

// Self-execute the app directly to allow app.js to be executed directly
createApp().catch((error) => {
	console.error(chalk.red('Failed to start application:'), error);
	process.exit(1);
});

// Export the createApp function for testing/import purposes
export default createApp;