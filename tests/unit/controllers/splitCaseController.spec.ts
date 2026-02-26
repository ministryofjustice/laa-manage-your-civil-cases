
import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';
import type { Request, Response } from 'express';
import { getSplitThisCaseForm } from '#src/scripts/controllers/splitCaseController.js';
import { apiService } from '#src/services/apiService.js';

// Define the RequestWithMiddleware interface for testing
interface RequestWithMiddleware extends Request {
  axiosMiddleware: any;
  csrfToken?: () => string;
  clientData?: any;
}

describe('Split Case Controller', () => {
  let req: Partial<RequestWithMiddleware>;
  let res: any;
  let next: any;
  let renderStub: sinon.SinonStub;
  let redirectStub: sinon.SinonStub;
  let statusStub: sinon.SinonStub;
  let getProviderChoicesStub: sinon.SinonStub;

  beforeEach(() => {
    req = {
      params: { caseReference: 'TEST123' },
      body: {},
      session: {} as any,
      axiosMiddleware: {} as any,
      csrfToken: () => 'test-csrf-token'
    } as Partial<RequestWithMiddleware>;

    renderStub = sinon.stub();
    redirectStub = sinon.stub();
    statusStub = sinon.stub().returns({ render: renderStub });

    res = {
      render: renderStub,
      redirect: redirectStub,
      status: statusStub
    };

    next = sinon.stub();

    getProviderChoicesStub = sinon.stub(apiService, 'getProviderChoices');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('handleSplitCase', () => {
    it('should render split case page with correct template', async () => {
    
      const mockClientData = {
        fullName: 'John Doe',
        caseReference: 'TEST123',
        dateOfBirth: '1990-01-01',
        providerId: 'PROV-001' 
      };
      req.clientData = mockClientData;

      getProviderChoicesStub
        .withArgs(req.axiosMiddleware, 'PROV-001')
        .resolves({
          status: 'success',
          data: { id: 'PROV-001', name: 'General Provider' } 
        });

      await getSplitThisCaseForm(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(renderStub.called).to.be.true;
      expect(
        renderStub.calledWith(
          'case_details/split-this-case.njk',
          sinon.match({
            caseReference: 'TEST123',
            client: mockClientData,
            provider: sinon.match({ id: 'PROV-001' }),
            errorState: sinon.match({ hasErrors: false }),
            csrfToken: 'test-csrf-token'
          })
        )
      ).to.be.true;

      // ensure we didn't fall into error path
      expect(next.called).to.be.false;
    });
  });
});
