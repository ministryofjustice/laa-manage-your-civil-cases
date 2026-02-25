import { describe, it, beforeEach } from 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';
import type { Request, Response, NextFunction } from 'express';
import { handleCaseTab } from '#src/scripts/helpers/caseTabHandler.js';

describe('caseTabHandler', () => {
  let req: Partial<Request>;
  let res: any;
  let next: sinon.SinonStub;
  let renderStub: sinon.SinonStub;
  let statusStub: sinon.SinonStub;

  beforeEach(() => {
    renderStub = sinon.stub();
    statusStub = sinon.stub().returns({ render: renderStub });
    next = sinon.stub();

    req = {
      params: { caseReference: 'TEST123' },
      session: {
        thirdPartyOriginal: { field: 'value' } as any,
        clientNameOriginal: { field: 'value' } as any,
        otherSessionKey: 'keep-me' as any
      } as any
    };

    res = {
      status: statusStub,
      render: renderStub
    };
  });

  it('executes tab-specific handler with expected context', async () => {
    const handler = sinon.stub().resolves();

    await handleCaseTab(
      req as Request,
      res as Response,
      next as unknown as NextFunction,
      'client_details',
      'client details',
      handler
    );

    expect(handler.calledOnce).to.be.true;
    expect(handler.firstCall.args[0]).to.include({
      caseReference: 'TEST123',
      activeTab: 'client_details'
    });
    expect(handler.firstCall.args[0].req).to.equal(req);
    expect(handler.firstCall.args[0].res).to.equal(res);
  });

  it('clears only session keys containing Original before running handler', async () => {
    const handler = sinon.stub().resolves();

    await handleCaseTab(
      req as Request,
      res as Response,
      next as unknown as NextFunction,
      'history',
      'case history details',
      handler
    );

    expect(req.session?.thirdPartyOriginal).to.equal(undefined);
    expect(req.session?.clientNameOriginal).to.equal(undefined);
    expect(req.session?.otherSessionKey).to.equal('keep-me');
  });

  it('returns early and renders 400 when case reference is invalid', async () => {
    req.params = {};
    const handler = sinon.stub().resolves();

    await handleCaseTab(
      req as Request,
      res as Response,
      next as unknown as NextFunction,
      'case_details',
      'case details',
      handler
    );

    expect(handler.called).to.be.false;
    expect(statusStub.calledWith(400)).to.be.true;
    expect(renderStub.calledWith('main/error.njk')).to.be.true;
  });

  it('passes processed errors to next when tab-specific handler throws', async () => {
    const thrownError = new Error('Boom');

    await handleCaseTab(
      req as Request,
      res as Response,
      next as unknown as NextFunction,
      'history',
      'case history details',
      async () => {
        throw thrownError;
      }
    );

    expect(next.calledOnce).to.be.true;
    expect(next.firstCall.args[0]).to.be.instanceOf(Error);
    expect(next.firstCall.args[0].message).to.include('An unexpected error occurred');
  });
});
