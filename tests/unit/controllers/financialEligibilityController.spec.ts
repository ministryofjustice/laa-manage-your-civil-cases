/**
 * Client Details Controller Tests
 * 
 * Tests the Express.js controller for individual case detail viewing functionality.
 * Covers case detail page routing and data presentation including:
 * - Tab-based navigation handling (details, notes, history)
 * - API integration for case-specific data retrieval
 * - Error handling and user feedback
 * - Template rendering with case context
 * 
 * Testing Level: Unit (Controller Layer)
 * Component: Express.js Client Details Controllers
 * Dependencies: apiService, case detail templates
 */

import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';
import type { Request, Response } from 'express';
import { handleFinancialEligibilityTab } from '#src/scripts/controllers/index.js';
import { apiService } from '#src/services/api/index.js';
// Import to get global type declarations for axiosMiddleware
import '#utils/server/axiosSetup.js';

describe('Financial Eligibility Controller', () => {
  let req: Partial<Request>;
  let res: any;
  let next: any;
  let renderStub: sinon.SinonStub;
  let statusStub: sinon.SinonStub;
  let financialEligibilityStub: sinon.SinonStub;

  beforeEach(() => {
    req = {
      params: { caseReference: 'TEST123' },
      session: {} as any, // Mock session object for session cleanup functionality
      axiosMiddleware: {} as any
    };

    renderStub = sinon.stub();
    statusStub = sinon.stub().returns({ render: renderStub });

    res = {
      render: renderStub,
      status: statusStub
    };

    next = sinon.stub();
    financialEligibilityStub = sinon.stub(apiService, 'getFinancialEligibility');
  });

  afterEach(() => {
    sinon.restore();
  });


  describe('handleFinancialEligibilityTab', () => {
    it('should fetch financial eligibility data and render page', async () => {
      const mockFinancialEligibility = {
        hasPartner: true,
        isUnder17: false
      };

      req.clientData = {
        fullName: 'John Doe',
        caseReference: 'TEST123'
      };

      financialEligibilityStub.resolves({
        data: mockFinancialEligibility
      });

      await handleFinancialEligibilityTab(
        req as Request,
        res as Response,
        next,
        'financial_eligibility'
      );

      expect(financialEligibilityStub.calledOnce).to.be.true;
      expect(financialEligibilityStub.calledWith(req.axiosMiddleware,'TEST123')).to.be.true;
      expect(renderStub.calledOnce).to.be.true;
      const [, renderData] = renderStub.firstCall.args;
      expect(renderData.financialEligibility).to.deep.equal(mockFinancialEligibility);

      expect(renderData.activeTab).to.equal('financial_eligibility');
    });

    it('should render with null financial eligibility data when API returns an error response', async () => {
      req.clientData = {
        fullName: 'John Doe',
        caseReference: 'TEST123'
      };

      financialEligibilityStub.resolves({status: 'error',data: null,message: 'API failed'});

      await handleFinancialEligibilityTab(
        req as Request,
        res as Response,
        next,
        'financial_eligibility'
      );

      expect(renderStub.calledOnce).to.be.true;
      const [, renderData] = renderStub.firstCall.args;
      expect(renderData.financialEligibility).to.equal(null);
    });
  });
});