import { describe, it, afterEach } from 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';
import type { Request, Response } from 'express';

import config from '#config.js';
import { HTTP } from '#src/services/api/base/constants.js';
import { createRelayState } from '#utils/server/auth.relay.js';
import { handleRelay } from '#src/scripts/helpers/auth.js';

describe('handleRelay', () => {
	afterEach(() => {
		sinon.restore();
	});

	function buildResponse(): Partial<Response> & {
		redirect: sinon.SinonStub;
		set: sinon.SinonStub;
		status: sinon.SinonStub;
		send: sinon.SinonStub;
	} {
		return {
			redirect: sinon.stub(),
			set: sinon.stub(),
			status: sinon.stub().returnsThis(),
			send: sinon.stub(),
		};
	}

	it('returns false when the state is not a relay payload', () => {
		const req = { hostname: 'app.example.test' } as Request;
		const res = buildResponse();

		const handled = handleRelay({ code: 'auth-code', state: 'plain-state' }, req, res as Response);

		expect(handled).to.be.false;
		expect(res.status.called).to.be.false;
		expect(res.send.called).to.be.false;
		expect(res.redirect.called).to.be.false;
		expect(res.set.called).to.be.false;
	});

	it('rejects relay states with disallowed targets', () => {
		const req = { hostname: 'app.example.test' } as Request;
		const res = buildResponse();
		const state = createRelayState(
			'relay-nonce',
			'https://evil.example.test',
			config.session.secret,
		);

		const handled = handleRelay({ code: 'auth-code', state }, req, res as Response);

		expect(handled).to.be.true;
		expect(res.status.calledOnceWithExactly(HTTP.BAD_REQUEST)).to.be.true;
		expect(res.send.calledOnceWithExactly('Invalid relay target')).to.be.true;
		expect(res.redirect.called).to.be.false;
		expect(res.set.called).to.be.false;
	});

	it('returns false when the relay target matches the current host', () => {
		const targetHost = 'branch-mcc-uat.cloud-platform.service.justice.gov.uk';
		const req = { hostname: targetHost } as Request;
		const res = buildResponse();
		const state = createRelayState(
			'relay-nonce',
			`https://${targetHost}`,
			config.session.secret,
		);

		const handled = handleRelay({ code: 'auth-code', state }, req, res as Response);

		expect(handled).to.be.false;
		expect(res.status.called).to.be.false;
		expect(res.send.called).to.be.false;
		expect(res.redirect.called).to.be.false;
		expect(res.set.called).to.be.false;
	});

	it('redirects to the relay target with the auth callback payload', () => {
		const targetHost = 'branch-mcc-uat.cloud-platform.service.justice.gov.uk';
		const req = { hostname: 'app.example.test' } as Request;
		const res = buildResponse();
		const state = createRelayState(
			'relay-nonce',
			`https://${targetHost}`,
			config.session.secret,
		);

		const handled = handleRelay({ code: 'auth-code', state }, req, res as Response);

		expect(handled).to.be.true;
		expect(res.set.calledOnceWithExactly('Cache-Control', 'no-store')).to.be.true;
		expect(res.redirect.calledOnceWithExactly(
			`https://${targetHost}/auth/callback?code=auth-code&state=${encodeURIComponent(state)}`,
		)).to.be.true;
		expect(res.status.called).to.be.false;
		expect(res.send.called).to.be.false;
	});
});
