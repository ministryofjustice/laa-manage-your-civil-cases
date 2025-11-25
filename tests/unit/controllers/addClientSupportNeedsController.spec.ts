/**
 * Add Client Support Needs Controller Tests
 * 
 * Tests the Express.js controllers for client details editing functionality.
 * Covers HTTP request/response handling for editing forms including:
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
import type { Request, Response, NextFunction } from 'express';
import {
  getAddClientSupportNeeds,
  postAddClientSupportNeeds
} from '#src/scripts/controllers/addClientSupportNeedsController.js';
import { apiService } from '#src/services/apiService.js';
// Import to get global type declarations for axiosMiddleware
import '#utils/axiosSetup.js';
import { validateAddClientSupportNeeds } from '#src/middlewares/clientSupportNeedsSchema.js';
import { ValidationChain } from '#node_modules/express-validator/lib/index.js';

// Define the RequestWithMiddleware interface for testing
interface RequestWithMiddleware extends Request {
  axiosMiddleware: any;
  csrfToken?: () => string;
}

// Run an express-validator schema against a fake request
const runSchema = async (req: any, schema: ValidationChain[] | ValidationChain): Promise<void> => {
  const chains = Array.isArray(schema) ? schema : [schema];
  for (const chain of chains) {
    await chain.run(req);
  }
};

describe('Add Client Support Needs Controller', () => {
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
      status: statusStub,
      locals: {
        languageItems: [{ text: 'Arabic' }, { text: 'Bengali' }, { text: 'Welsh' }, { text: 'French' }] // Sample language data
      }
    };

    next = sinon.stub();

    // Stub the API service methods
    apiServiceGetStub = sinon.stub(apiService, 'getClientDetails');
    apiServiceUpdateStub = sinon.stub(apiService, 'addClientSupportNeeds');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('getAddClientSupportNeeds', () => {
    it('should render form for adding client third party data and CSRF protection', async () => {
      // Arrange
      const mockApiResponse = {
        status: 'success',
        data: {
          caseReference: 'TEST123'
        }
      };

      apiServiceGetStub.resolves(mockApiResponse);

      // Act
      await getAddClientSupportNeeds(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(apiServiceGetStub.calledOnce).to.be.true;
      expect(renderStub.calledWith('case_details/client_support_needs/add-client-support-needs.njk')).to.be.true;
    });

    it('should delegate API errors to Express error handling middleware', async () => {
      // Arrange
      const error = new Error('API Error');
      apiServiceGetStub.rejects(error);

      // Act
      await getAddClientSupportNeeds(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(next.calledOnce).to.be.true;
    });
  });

  describe('postAddClientSupportNeeds', () => {
    it('should process successful addition of client support needs checkbox selection and redirect to case details', async () => {
      // Arrange
      req.body = { clientSupportNeeds: ['bslWebcam', 'textRelay'] };

      apiServiceUpdateStub.resolves({
        status: 'success',
        data: { clientSupportNeeds: ['bslWebcam', 'textRelay'] }
      });

      // Act
      await postAddClientSupportNeeds(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(apiServiceUpdateStub.calledOnce).to.be.true;
      expect(redirectStub.calledWith('/cases/TEST123/client-details')).to.be.true;
    });

    it('should handle validation errors for not selecting any checkboxes', async () => {
      // Arrange
      req.body = {}; // Empty checkboxes should trigger validation

      await runSchema(req as any, validateAddClientSupportNeeds());

      // Stub a successful getClientDetails response so handleAddClientSupportNeedsErrors thinks it has info
      apiServiceGetStub.resolves({
        status: 'success'
      });

      // Act
      await postAddClientSupportNeeds(req as RequestWithMiddleware, res as Response, next);

      // Assert - Should configure form response with errors, not redirect
      expect(redirectStub.called).to.be.false;
      expect(renderStub.calledWith('case_details/client_support_needs/add-client-support-needs.njk')).to.be.true;
    });

    it('should handle validation errors for `languageSupportNeeds` field', async () => {
      // Arrange
      req.body = { 
        clientSupportNeeds: ['languageSelection'],
        languageSupportNeeds: '' // Should not be empty
      }; 

      await runSchema(req as any, validateAddClientSupportNeeds());

      // Stub a successful getClientDetails response so handleAddClientSupportNeedsErrors thinks it has info
      apiServiceGetStub.resolves({
        status: 'success'
      });

      // Act
      await postAddClientSupportNeeds(req as RequestWithMiddleware, res as Response, next);

      // Assert - Should configure form response with errors, not redirect
      expect(redirectStub.called).to.be.false;
      expect(renderStub.calledWith('case_details/client_support_needs/add-client-support-needs.njk')).to.be.true;
    });

    it('should handle validation errors for `notes` field', async () => {
      // Arrange
      req.body = { 
        clientSupportNeeds: ['otherSupport'],
        notes: '' // Should not be empty
      }; 

      await runSchema(req as any, validateAddClientSupportNeeds());

      // Stub a successful getClientDetails response so handleAddClientSupportNeedsErrors thinks it has info
      apiServiceGetStub.resolves({
        status: 'success'
      });

      // Act
      await postAddClientSupportNeeds(req as RequestWithMiddleware, res as Response, next);

      // Assert - Should configure form response with errors, not redirect
      expect(redirectStub.called).to.be.false;
      expect(renderStub.calledWith('case_details/client_support_needs/add-client-support-needs.njk')).to.be.true;
    });
  });
});
