import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';
import type { Request, Response } from 'express';
import { ConfidentialClientApplication } from '@azure/msal-node';

import { handleSilasCallback } from '#src/scripts/controllers/loginController.js';
import config from '#config.js';
import { HTTP } from '#src/services/api/base/constants.js';
import { SilasIdentityMappingError } from '#src/services/silasAuthService.js';
import { createRelayState } from '#utils/server/auth.relay.js';

function toBase64Url(value: string): string {
	return Buffer.from(value).toString('base64url');
}

function normalizeScope(scope: string): string {
	if (!scope.includes('/')) {
		return scope;
	}

	const segments = scope.split('/').filter(Boolean);
	return segments[segments.length - 1] ?? scope;
}

function buildAccessToken(claimOverrides: Record<string, unknown> = {}): string {
	const apiScope = config.silas.scopes
		.find((scope) => !['openid', 'profile', 'offline_access'].includes(scope.toLowerCase()));

	const claims = {
		iss: `https://login.microsoftonline.com/${config.silas.tenantId}/v2.0`,
		aud: config.silas.expectedAudience,
		scp: apiScope !== undefined ? normalizeScope(apiScope) : 'openid',
		preferred_username: 'user@example.test',
		oid: 'user-oid',
		...claimOverrides,
	};

	return [
		toBase64Url(JSON.stringify({ alg: 'none', typ: 'JWT' })),
		toBase64Url(JSON.stringify(claims)),
		'signature',
	].join('.');
}

describe('Login Controller', () => {
	let req: Partial<Request> & { session: Record<string, unknown> };
	let res: Partial<Response> & { render: sinon.SinonStub; redirect: sinon.SinonStub; send: sinon.SinonStub; set: sinon.SinonStub; status: sinon.SinonStub };
	let regenerateStub: sinon.SinonStub;
	let saveStub: sinon.SinonStub;
	let acquireTokenByCodeStub: sinon.SinonStub;

	beforeEach(() => {
		regenerateStub = sinon.stub().callsFake((callback: (error?: Error | null) => void) => {
			callback(null);
		});
		saveStub = sinon.stub().callsFake((callback: (error?: Error | null) => void) => {
			callback(null);
		});

		req = {
			hostname: 'app.example.test',
			session: {
				silasLoginState: 'expected-state',
				regenerate: regenerateStub,
				save: saveStub,
			} as any,
		};

		res = {
			render: sinon.stub(),
			redirect: sinon.stub() as sinon.SinonStub,
			send: sinon.stub(),
			set: sinon.stub(),
			status: sinon.stub().returnsThis(),
		};

		acquireTokenByCodeStub = sinon.stub(ConfidentialClientApplication.prototype, 'acquireTokenByCode');
	});

	afterEach(() => {
		sinon.restore();
	});

	describe('handleSilasCallback', () => {
		it('renders an error when the callback state is invalid', async () => {
			req.query = { code: 'auth-code', state: 'unexpected-state' };

			await handleSilasCallback(req as Request, res as Response);

			expect((res.status as sinon.SinonStub).calledOnceWithExactly(HTTP.BAD_REQUEST)).to.be.true;
			expect((res.render as sinon.SinonStub).calledOnceWithExactly('main/error.njk', {
				status: HTTP.BAD_REQUEST,
				error: 'Invalid authentication callback.',
			})).to.be.true;
			expect(acquireTokenByCodeStub.called).to.be.false;
		});

		it('stores SiLAS auth details and redirects on successful callback', async () => {
			req.query = { code: 'auth-code', state: 'expected-state' };
			const accessToken = buildAccessToken();
			acquireTokenByCodeStub.resolves({
				accessToken,
				idToken: 'id-token',
				expiresOn: new Date(123456789),
				account: {
					username: 'user@example.test',
					name: 'Test User',
					localAccountId: 'user-oid',
				},
			});

			await handleSilasCallback(req as Request, res as Response);

			expect(acquireTokenByCodeStub.calledOnce).to.be.true;
			expect(regenerateStub.calledOnce).to.be.true;
			expect(req.session.silasAuth).to.deep.equal({
				accessToken,
				idToken: 'id-token',
				expiresAt: 123456789,
				scopes: config.silas.scopes,
			});
			expect(req.session.user).to.deep.equal({
				email: 'user@example.test',
				name: 'Test User',
				oid: 'user-oid',
			});
			expect(saveStub.calledOnce).to.be.true;
			expect(res.redirect.calledOnceWithExactly('/cases/new')).to.be.true;
		});

		it('renders the mapping error message when the provider identity is not linked', async () => {
			req.query = { code: 'auth-code', state: 'expected-state' };
			acquireTokenByCodeStub.rejects(new SilasIdentityMappingError('not linked'));

			await handleSilasCallback(req as Request, res as Response);

			expect(res.status.calledOnceWithExactly(HTTP.BAD_REQUEST)).to.be.true;
			expect(res.render.calledOnceWithExactly('main/error.njk', {
				status: HTTP.BAD_REQUEST,
				error: 'Your account is authenticated but not linked to a provider profile in MCC yet. Please contact the MCC support team.',
			})).to.be.true;
		});

		it('renders a generic error when token exchange fails', async () => {
			req.query = { code: 'auth-code', state: 'expected-state' };
			acquireTokenByCodeStub.rejects(new Error('token exchange failed'));

			await handleSilasCallback(req as Request, res as Response);

			expect(res.status.calledOnceWithExactly(HTTP.BAD_REQUEST)).to.be.true;
			expect(res.render.calledOnceWithExactly('main/error.njk', {
				status: HTTP.BAD_REQUEST,
				error: 'Unable to complete sign-in. Please try again.',
			})).to.be.true;
		});

		it('rejects relay callbacks with an invalid relay target', async () => {
			req.query = {
				code: 'auth-code',
				state: createRelayState(
					'relay-nonce',
					'https://evil.example.test',
					config.session.secret,
				),
			};

			await handleSilasCallback(req as Request, res as Response);

			expect(res.status.calledOnceWithExactly(HTTP.BAD_REQUEST)).to.be.true;
			expect(res.send.calledOnceWithExactly('Invalid relay target')).to.be.true;
			expect(acquireTokenByCodeStub.called).to.be.false;
		});

		it('relays the callback to the target ephemeral environment', async () => {
			req = {
				...req,
				hostname: 'main.example.test',
				query: {
					code: 'auth-code',
					state: createRelayState(
						'relay-nonce',
						'https://branch-mcc-uat.cloud-platform.service.justice.gov.uk',
						config.session.secret,
					),
				},
			};

			await handleSilasCallback(req as Request, res as Response);

			expect(res.set.calledOnceWithExactly('Cache-Control', 'no-store')).to.be.true;
			expect(res.redirect.calledOnceWithExactly(
				`https://branch-mcc-uat.cloud-platform.service.justice.gov.uk/auth/callback?code=auth-code&state=${encodeURIComponent(req.query?.state as string)}`
			)).to.be.true;
			expect(acquireTokenByCodeStub.called).to.be.false;
		});
	});
});
