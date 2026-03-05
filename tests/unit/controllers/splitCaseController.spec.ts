/**
 * Split Case Controller Tests
 * 
 * Tests the Express.js controller factory for case listing functionality.
 * Covers HTTP request/response handling for form including:
 * - GET route handler for form display with dynamic choices
 * - POST route handler for form submission  
 * - CSRF token management
 * - Form data processing and validation integration
 * 
 * Testing Level: Unit (Controller Layer)
 * Component: Express.js Dynamic Route Handlers
 * Dependencies: apiService, case listing templates
 */

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
  let res: Partial<Response>;
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
    it('should render "split this case" page with correct template', async () => {
      // Arrange
      const mockClientData = {
        fullName: 'John Doe',
        caseReference: 'TEST123',
        dateOfBirth: '1990-01-01',
        providerId: '12' 
      };
      req.clientData = mockClientData;

      getProviderChoicesStub
        .withArgs(req.axiosMiddleware, '12')
        .resolves({
          status: 'success',
          data: { id: '12', name: 'General Provider' } 
        });

      // Act
      await getSplitThisCaseForm(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(renderStub.called).to.be.true;
      expect(
        renderStub.calledWith(
          'case_details/split-this-case.njk',
          sinon.match({
            caseReference: 'TEST123',
            client: mockClientData,
            provider: sinon.match({ id: '12' }),
            errorState: sinon.match({ hasErrors: false }),
            csrfToken: 'test-csrf-token'
          })
        )
      ).to.be.true;

      expect(next.called).to.be.false;

      // Arrange
      it('should call next with error when providerId is missing', async () => {
        req.clientData = {
          fullName: 'John Doe',
          caseReference: 'TEST123',
          dateOfBirth: '1990-01-01',
          providerId: ''  // No providerId on purpose
        };

        // Act
        await getSplitThisCaseForm(req as RequestWithMiddleware, res as Response, next);

        // Assert
        expect(renderStub.called).to.be.false;
        expect(next.calledOnce).to.be.true; // Should delegate to error handler
        const err = next.firstCall.args[0];
        expect(err).to.be.instanceOf(Error);
        expect(String(err.message)).to.match(/Missing providerId in clientData/i);
      });

      // Arrange
      it('should call next with error when provider choices API fails', async () => {
        req.clientData = {
          fullName: 'John Doe',
          caseReference: 'TEST123',
          dateOfBirth: '1990-01-01',
          providerId: '99'
        };

        // Simulate API error response (either status: 'error' OR data: null)
        getProviderChoicesStub
          .withArgs(req.axiosMiddleware, '99')
          .resolves({ status: 'error', data: null });

        // Act
        await getSplitThisCaseForm(req as RequestWithMiddleware, res as Response, next);

        // Assert
        expect(renderStub.called).to.be.false;
        expect(next.calledOnce).to.be.true; // Should delegate to error handler
        const err = next.firstCall.args[0];
        expect(err).to.be.instanceOf(Error);
        expect(String(err.message)).to.match(/Failed to fetch provider name/i);
      });
    });
  });
});
