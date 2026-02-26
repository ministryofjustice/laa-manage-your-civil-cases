import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';
import type { Request, Response, NextFunction } from 'express';
import { handleCaseHistoryTab } from '#src/scripts/controllers/caseHistoryController.js';
import { apiService } from '#src/services/apiService.js';
import '#utils/server/axiosSetup.js';

describe('Case History Controller', () => {
  let req: Partial<Request>;
  let res: any;
  let next: sinon.SinonStub;
  let renderStub: sinon.SinonStub;
  let statusStub: sinon.SinonStub;
  let getClientHistoryDetailsStub: sinon.SinonStub;

  beforeEach(() => {
    renderStub = sinon.stub();
    statusStub = sinon.stub().returns({ render: renderStub });
    next = sinon.stub();

    req = {
      params: { caseReference: 'TEST123' },
      query: {},
      session: {
        thirdPartyOriginal: { field: 'value' } as any,
        someOtherKey: 'keep-me' as any
      } as any,
      clientData: {
        fullName: 'John Doe',
        caseReference: 'TEST123'
      } as any,
      locale: {
        t: (key: string): string => key
      } as any,
      axiosMiddleware: {} as any
    };

    res = {
      render: renderStub,
      status: statusStub
    };

    getClientHistoryDetailsStub = sinon.stub(apiService, 'getClientHistoryDetails');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('renders case history tab with timeline items when API returns success', async () => {
    getClientHistoryDetailsStub.resolves({
      status: 'success',
      data: [
        {
          code: 'SPOP',
          createdBy: 'caseworker@example.com',
          created: '2026-02-20T10:30:00Z',
          notes: 'Status changed to claim'
        }
      ]
    });

    await handleCaseHistoryTab(req as Request, res as Response, next as unknown as NextFunction, 'history');

    expect(getClientHistoryDetailsStub.calledOnce).to.be.true;
    expect(renderStub.calledOnce).to.be.true;
    expect(renderStub.firstCall.args[0]).to.equal('case_details/index.njk');

    const viewModel = renderStub.firstCall.args[1] as {
      activeTab: string;
      caseReference: string;
      client: unknown;
      timelineItems: Array<{ label: { text: string } }>;
      pagination: unknown;
    };
    expect(viewModel.activeTab).to.equal('history');
    expect(viewModel.caseReference).to.equal('TEST123');
    expect(viewModel.client).to.deep.equal(req.clientData);
    expect(viewModel.timelineItems).to.be.an('array').with.length(1);
    expect(viewModel.pagination).to.be.an('object');
    expect(viewModel.timelineItems[0].label.text).to.include('SPOP');
    expect(req.session?.thirdPartyOriginal).to.equal(undefined);
    expect(req.session?.someOtherKey).to.equal('keep-me');
  });

  it('returns 400 and does not call API when case reference is missing', async () => {
    req.params = {};

    await handleCaseHistoryTab(req as Request, res as Response, next as unknown as NextFunction, 'history');

    expect(getClientHistoryDetailsStub.called).to.be.false;
    expect(statusStub.calledWith(400)).to.be.true;
    expect(renderStub.calledWith('main/error.njk')).to.be.true;
  });

  it('renders 404 page when history API returns error', async () => {
    getClientHistoryDetailsStub.resolves({
      status: 'error',
      data: null,
      message: 'History not found'
    });

    await handleCaseHistoryTab(req as Request, res as Response, next as unknown as NextFunction, 'history');

    expect(statusStub.calledWith(404)).to.be.true;
    expect(renderStub.calledWith('main/error.njk')).to.be.true;
  });

  it('passes processed error to next when API call throws', async () => {
    getClientHistoryDetailsStub.rejects(new Error('API failure'));

    await handleCaseHistoryTab(req as Request, res as Response, next as unknown as NextFunction, 'history');

    expect(next.calledOnce).to.be.true;
    expect(next.firstCall.args[0]).to.be.instanceOf(Error);
    expect(next.firstCall.args[0].message).to.include('An unexpected error occurred');
  });
});
