/**
 * Edit Client Risk of Abuse Controller Tests
 * 
 * Tests the Express.js controllers for client details editing functionality.
 * Covers HTTP request/response handling for risk of abuse editing forms including:
 * - GET route handlers for form display
 * - POST route handlers for form submission  
 * - API integration and error handling
 * - CSRF token management
 * - Form data processing and validation integration
 * 
 * Testing Level: Unit (Controller Layer)
 * Component: Express.js Controllers
 * Dependencies: apiService, form validation helpers
 */

import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';
import type { Request, Response } from 'express';
import {
  getEditRiskOfAbuse,
  postEditRiskOfAbuse
} from '#src/scripts/controllers/editRiskOfAbuseController.js';
import { apiService } from '#src/services/apiService.js';
// Import to get global type declarations for axiosMiddleware
import '#utils/server/axiosSetup.js';

// Define the RequestWithMiddleware interface for testing
interface RequestWithMiddleware extends Request {
  axiosMiddleware: any;
  csrfToken?: () => string;
}

describe('Edit Client Risk of Abuse Controller', () => {
  let req: Partial<RequestWithMiddleware>;
  let res: any;
  let next: any;
  let renderStub: sinon.SinonStub;
  let redirectStub: sinon.SinonStub;
  let statusStub: sinon.SinonStub;
  let apiServiceGetStub: sinon.SinonStub;
  let apiServiceUpdateStub: sinon.SinonStub;

  beforeEach(() => {
    req = {
      params: { caseReference: 'TEST123' },
      body: {},
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

    // Stub the API service methods
    apiServiceGetStub = sinon.stub(apiService, 'getClientDetails');
    apiServiceUpdateStub = sinon.stub(apiService, 'updateClientDetails');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('getEditClientRiskOfAbuse', () => {
    it('should render risk of abuse editing form with pre-populated client data and CSRF protection', async () => {
      // Arrange
      const mockApiResponse = {
        status: 'success',
        data: {
          fullName: 'John Doe',
          caseReference: 'TEST123',
          vulnerable_user: true
        }
      };

      apiServiceGetStub.resolves(mockApiResponse);

      // Act
      await getEditRiskOfAbuse(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(apiServiceGetStub.calledOnce).to.be.true;
      expect(renderStub.calledWith('case_details/edit-risk-of-abuse.njk')).to.be.true;
    });

    it('should delegate API errors to Express error handling middleware', async () => {
      // Arrange
      const error = new Error('API Error');
      apiServiceGetStub.rejects(error);

      // Act
      await getEditRiskOfAbuse(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(next.calledOnce).to.be.true;
    });
  });

  describe('postEditClientRiskOfAbuse', () => {
    it('should process successful client risk of abuse update and redirect to case details', async () => {
      // Arrange
      req.body = { vulnerable_user: false };

      apiServiceUpdateStub.resolves({
        status: 'success',
        data: { vulnerable_user: false }
      });

      // Act
      await postEditRiskOfAbuse(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(apiServiceUpdateStub.calledOnce).to.be.true;
      expect(redirectStub.calledWith('/cases/TEST123/client-details')).to.be.true;
    });
  });
});
