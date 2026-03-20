import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';

import type { Request, Response, NextFunction } from 'express';

import { acceptCase, completeCase } from '#src/scripts/controllers/caseStateController.js';
import { changeCaseStateService } from '#src/services/changeCaseStateService.js';

describe('caseStateController.acceptCase – redirect safety', () => {
  let req: Partial<Request>;
  let res: any;
  let next: sinon.SinonStub;

  let redirectStub: sinon.SinonStub;
  let acceptCaseServiceStub: sinon.SinonStub;

  const caseReference = '123';
  const fallback = `/cases/${caseReference}/client-details`;

  beforeEach(() => {
    redirectStub = sinon.stub();
    next = sinon.stub();

    res = {
      redirect: redirectStub
    };

    req = {
      params: { caseReference },
      get: sinon.stub() as any
    };


// Now attach axiosMiddleware so it is not overwritten
  req.axiosMiddleware = {
    request: sinon.stub(),
    get: sinon.stub(),
    delete: sinon.stub(),
    head: sinon.stub(),
    options: sinon.stub(),
    post: sinon.stub(),
    put: sinon.stub(),
    patch: sinon.stub(),
    interceptors: {
      request: { use: sinon.stub() },
      response: { use: sinon.stub() }
    }
  } as any;

    acceptCaseServiceStub = sinon
      .stub(changeCaseStateService, 'acceptCase')
      .resolves();
  });

  afterEach(() => {
    sinon.restore();
  });

  // ALL REFERER SCENARIOS BELOW

  it('External host → fallback', async () => {
    (req.get as sinon.SinonStub).returns('https://evil.com');

    await acceptCase(req as Request, res as Response, next as NextFunction);

    expect(redirectStub.calledWith(fallback)).to.be.true;
  });

  it('External host with valid path → path only', async () => {
    (req.get as sinon.SinonStub).returns(
      'https://evil.com/cases/123/client-details'
    );

    await acceptCase(req as Request, res as Response, next as NextFunction);

    expect(redirectStub.calledWith('/cases/123/client-details')).to.be.true;
  });

  it('Same-origin absolute → keep path', async () => {
    (req.get as sinon.SinonStub).returns(
      'https://service.gov.uk/cases/123/client-details'
    );

    await acceptCase(req as Request, res as Response, next as NextFunction);

    expect(redirectStub.calledWith('/cases/123/client-details')).to.be.true;
  });

  it('Relative path → preserved as-is', async () => {
    (req.get as sinon.SinonStub).returns('/cases/123/case-details');

    await acceptCase(req as Request, res as Response, next as NextFunction);

    expect(redirectStub.calledWith('/cases/123/case-details')).to.be.true;
  });

  it('Absent header → fallback', async () => {
    (req.get as sinon.SinonStub).returns(undefined);

    await acceptCase(req as Request, res as Response, next as NextFunction);

    expect(redirectStub.calledWith(fallback)).to.be.true;
  });

  it('Malformed value → fallback', async () => {
    (req.get as sinon.SinonStub).returns('not a url');

    await acceptCase(req as Request, res as Response, next as NextFunction);

    expect(redirectStub.calledWith(fallback)).to.be.true;
  });
});

describe('caseStateController.completeCase – method calls + redirect safety', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: sinon.SinonStub;

  let redirectStub: sinon.SinonStub;
  let completeCaseServiceStub: sinon.SinonStub;

  const caseReference = '123';
  const fallback = `/cases/${caseReference}/client-details`;

  beforeEach(() => {
    redirectStub = sinon.stub();
    next = sinon.stub();

    res = {
      redirect: redirectStub
    };

    req = {
      params: { caseReference },
      get: sinon.stub() as any
    };

    // axiosMiddleware required by service call
    req.axiosMiddleware = {
      request: sinon.stub(),
      get: sinon.stub(),
      delete: sinon.stub(),
      head: sinon.stub(),
      options: sinon.stub(),
      post: sinon.stub(),
      put: sinon.stub(),
      patch: sinon.stub(),
      interceptors: {
        request: { use: sinon.stub() },
        response: { use: sinon.stub() }
      }
    } as any;

    completeCaseServiceStub = sinon
      .stub(changeCaseStateService, 'completeCase')
      .resolves();
  });

  afterEach(() => sinon.restore());

  // SERVICE CALL VALIDATION

  it('calls changeCaseStateService.completeCase with correct args', async () => {
    (req.get as sinon.SinonStub).returns(undefined); // force fallback

    await completeCase(req as Request, res as Response, next as NextFunction);

    expect(completeCaseServiceStub.calledOnce).to.be.true;
    expect(completeCaseServiceStub.calledWith(req.axiosMiddleware, caseReference))
      .to.be.true;
  });

  // REDIRECT SCENARIOS

  it('External host → fallback', async () => {
    (req.get as sinon.SinonStub).returns('https://evil.com');

    await completeCase(req as Request, res as Response, next as NextFunction);

    expect(redirectStub.calledWith(fallback)).to.be.true;
  });

  it('External host with valid path → uses only the path', async () => {
    (req.get as sinon.SinonStub).returns(
      'https://evil.com/cases/123/client-details'
    );

    await completeCase(req as Request, res as Response, next as NextFunction);

    expect(redirectStub.calledWith('/cases/123/client-details')).to.be.true;
  });

  it('Relative path → preserved', async () => {
    (req.get as sinon.SinonStub).returns('/cases/123/overview');

    await completeCase(req as Request, res as Response, next as NextFunction);

    expect(redirectStub.calledWith('/cases/123/overview')).to.be.true;
  });

  it('No referer → fallback', async () => {
    (req.get as sinon.SinonStub).returns(undefined);

    await completeCase(req as Request, res as Response, next as NextFunction);

    expect(redirectStub.calledWith(fallback)).to.be.true;
  });
});

