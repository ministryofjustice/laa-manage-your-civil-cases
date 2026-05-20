import { strict as assert } from 'assert';
import type express from 'express';
import sinon from 'sinon';
import { setupSentry } from '#utils/server/sentrySetup.js';
import type { Config } from '#types/config-types.js';

describe('setupSentry', () => {
	afterEach(() => {
		delete process.env.SENTRY_DSN;
		sinon.restore();
	});

	it('should call Sentry.init with expected config and setup express error handler', () => {
		process.env.SENTRY_DSN = 'test-dsn';

		const sentryClient = {
			init: sinon.stub(),
			setupExpressErrorHandler: sinon.stub()
		};

		const app = {
			use: sinon.stub()
		} as unknown as express.Application;

		const config = {
			app: {
				environment: 'development'
			},
			sentry: {
				dsn: 'https://examplePublicKey@o0.ingest.sentry.io/0',
				environment: 'test',
				release: '1.2.3',
				sendDefaultPii: true
			}
		} as Config;

		setupSentry(app, config, sentryClient as any);

		assert(sentryClient.init.calledOnceWithExactly({
			dsn: config.sentry.dsn,
			debug: true,
			environment: config.sentry.environment,
			release: config.sentry.release,
			sendDefaultPii: config.sentry.sendDefaultPii
		}));
		assert(sentryClient.setupExpressErrorHandler.calledOnceWithExactly(app));
	});
});
