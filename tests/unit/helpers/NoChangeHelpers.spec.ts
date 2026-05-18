
/**
 * handleNoChangeRedirect Helper Tests
 *
 * Tests the logic for detecting unchanged form submissions.
 * Covers:
 * - Matching values → triggers redirect + session banner
 * - Non-matching values → no redirect
 * - Missing (undefined) current values
 * - Trim behaviour
 * - Edge cases
 */

import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';
import type { Request, Response } from 'express';

import { handleNoChangeRedirect } from '#src/scripts/helpers/NoChangeHelpers.js';
import type { Session, SessionData } from 'express-session';

describe('handleNoChangeRedirect', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let redirectStub: sinon.SinonStub;

  function createMockSession(): Session & Partial<SessionData> {
    return {
      id: 'test-session-id',
      cookie: {} as any,
      regenerate: sinon.stub(),
      destroy: sinon.stub(),
      reload: sinon.stub(),
      save: sinon.stub(),
      touch: sinon.stub()
    } as unknown as Session & Partial<SessionData>;
  }

  beforeEach(() => {
    req = {
      params: { caseReference: 'TEST123' },
      session: createMockSession()
    };

    redirectStub = sinon.stub();

    res = {
      redirect: redirectStub
    };

  });

  afterEach(() => {
    sinon.restore();
  });


  it('should redirect and set banner when all values match', () => {
    const fields = [
      { current: 'test', existing: 'test' }
    ];

    const result = handleNoChangeRedirect(req as Request, res as Response, fields);

    expect(result).to.be.true;

    expect(req.session?.noChangeWarningBanner).to.deep.equal({
      variant: 'warning',
      title: 'No changes were made',
      dismissible: true
    });

    expect(redirectStub.calledOnce).to.be.true;
  });

  it('should not redirect when values differ', () => {
    const fields = [
      { current: 'test', existing: 'different' }
    ];

    const result = handleNoChangeRedirect(req as Request, res as Response, fields);

    expect(result).to.be.false;
    expect(req.session?.noChangeWarningBanner).to.be.undefined;
    expect(redirectStub.called).to.be.false;
  });

  it('should treat undefined current as existing value', () => {
    const fields = [
      { current: undefined, existing: 'false' }
    ];

    const result = handleNoChangeRedirect(req as Request, res as Response, fields);

    expect(result).to.be.true;
    expect(req.session?.noChangeWarningBanner).to.deep.equal({
      variant: 'warning',
      title: 'No changes were made',
      dismissible: true
    });
    expect(redirectStub.calledOnce).to.be.true;
  });

  it('should trim values before comparison', () => {
    const fields = [
      { current: '  test  ', existing: 'test' }
    ];

    const result = handleNoChangeRedirect(req as Request, res as Response, fields);

    expect(result).to.be.true;
    expect(req.session?.noChangeWarningBanner).to.deep.equal({
      variant: 'warning',
      title: 'No changes were made',
      dismissible: true
    });
    expect(redirectStub.calledOnce).to.be.true;
  });

  it('should not redirect if any field differs', () => {
    const fields = [
      { current: 'same', existing: 'same' },
      { current: 'different', existing: 'same' }
    ];

    const result = handleNoChangeRedirect(req as Request, res as Response, fields);

    expect(result).to.be.false;
    expect(redirectStub.called).to.be.false;
  });

  it('should redirect if all fields match', () => {
    const fields = [
      { current: 'same', existing: 'same' },
      { current: 'same', existing: 'same' }
    ];

    const result = handleNoChangeRedirect(req as Request, res as Response, fields);

    expect(result).to.be.true;
    expect(req.session?.noChangeWarningBanner).to.deep.equal({
      variant: 'warning',
      title: 'No changes were made',
      dismissible: true
    });
    expect(redirectStub.called).to.be.true;
  });

  it('should redirect if fields array is empty - checking empty optional values should return true', () => {
    const fields: any[] = [];

    const result = handleNoChangeRedirect(req as Request, res as Response, fields);

    expect(result).to.be.true;
    expect(req.session?.noChangeWarningBanner).to.deep.equal({
      variant: 'warning',
      title: 'No changes were made',
      dismissible: true
    });
    expect(redirectStub.calledOnce).to.be.true;
  });

  it('should handle null and empty strings as equal when normalised', () => {
    const fields = [
      { current: null, existing: '' }
    ];

    const result = handleNoChangeRedirect(req as Request, res as Response, fields);

    expect(result).to.be.true;
    expect(req.session?.noChangeWarningBanner).to.deep.equal({
      variant: 'warning',
      title: 'No changes were made',
      dismissible: true
    });
    expect(redirectStub.calledOnce).to.be.true;
  });
});

