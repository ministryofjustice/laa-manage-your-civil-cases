import type express from 'express';
import * as Sentry from "@sentry/node";
import type { Config } from '#types/config-types.js';


/**
 * Sets up Sentry error tracking for the Express application if SENTRY_DSN is configured.
 * @param {express.Application} app - The Express application instance to set up Sentry on
 * @param {Config} config - The application configuration object containing Sentry settings
 * @param {typeof Sentry} sentryClientClass - The Sentry client class to use (default is the imported Sentry module)
 */
export const setupSentry = (app: express.Application, config: Config, sentryClientClass: typeof Sentry = Sentry): void => {
    if (process.env.SENTRY_DSN !== undefined) {
		sentryClientClass.init({
			dsn: config.sentry.dsn,
			debug: config.app.environment === 'development',
			environment: config.sentry.environment,
			release: config.sentry.release,
			sendDefaultPii: config.sentry.sendDefaultPii,
		});
		sentryClientClass.setupExpressErrorHandler(app);
	}
}