/**
 * Edit Client Support Controller Tests
 * 
 * Tests the Express.js controllers for client support needs editing functionality.
 * Covers HTTP request/response handling for client support needs editing forms including:
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
  getEditClientSupportNeeds,
  postEditClientSupportNeeds
} from '#src/scripts/controllers/editClientSupportNeedsController.js';
import { apiService } from '#src/services/apiService.js';
// Import to get global type declarations for axiosMiddleware
import '#utils/axiosSetup.js';
import { validateEditClientSupportNeeds } from '#src/middlewares/clientSupportNeedsSchema.js';
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

describe('Edit Client Support Needs Controller', () => {
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
      session: {} as any, // Mock session object for session-based validation
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
    apiServiceUpdateStub = sinon.stub(apiService, 'updateClientSupportNeeds');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('getEditClientSupportNeeds', () => {
    it('should render form with pre-populated client support needs data and CSRF protection', async () => {
      // Arrange
      const mockApiResponse = {
        status: 'success',
        data: {
          caseReference: 'TEST123',
          clientSupportNeeds: ['bslWebcam', 'textRelay']
        }
      };

      apiServiceGetStub.resolves(mockApiResponse);

      // Act
      await getEditClientSupportNeeds(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(apiServiceGetStub.calledOnce).to.be.true;
      expect(renderStub.calledWith('case_details/client_support_needs/change-client-support-needs.njk')).to.be.true;
    });

    it('should delegate API errors to Express error handling middleware', async () => {
      // Arrange
      const error = new Error('API Error');
      apiServiceGetStub.rejects(error);

      // Act
      await getEditClientSupportNeeds(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(next.calledOnce).to.be.true;
    });
  });

  describe('postEditClientSupportNeeds', () => {
    it('should process successful client support needs update and redirect to case details', async () => {
      // Arrange
      req.body = { clientSupportNeeds: ['bslWebcam', 'textRelay'] };

      // Mock session data to simulate that original data was stored during GET request
      req.session!.clientSupportNeedsOriginal = {
        clientSupportNeeds: 'bslWebcam'
      };

      apiServiceUpdateStub.resolves({
        status: 'success',
        data: { clientSupportNeeds: ['bslWebcam', 'textRelay'] }
      });

      // Act
      await postEditClientSupportNeeds(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(apiServiceUpdateStub.calledOnce).to.be.true;
      expect(redirectStub.calledWith('/cases/TEST123/client-details')).to.be.true;
    });

    it('should handle validation errors and re-render form', async () => {
      // Arrange
      req.body = { 
        clientSupportNeeds: '' // Empty checkboxes should trigger validation
      };

      await runSchema(req as any, validateEditClientSupportNeeds());

      // Stub a successful getClientDetails response so handleAddClientSupportNeedsErrors thinks it has info
      apiServiceGetStub.resolves({
        status: 'success'
      });

      // Act
      await postEditClientSupportNeeds(req as RequestWithMiddleware, res as Response, next);

      // Assert - Should configure form response with errors, not redirect
      expect(redirectStub.called).to.be.false;
      expect(renderStub.calledWith('case_details/client_support_needs/change-client-support-needs.njk')).to.be.true;
    });

    it('should handle no changes scenario properly', async () => {
      // Arrange - Set up session with original data  
      req.session!.clientSupportNeedsOriginal = {
        clientSupportNeeds: 'bslWebcam'
      };
      
      req.body = { 
        clientSupportNeeds: 'bslWebcam', // Same value = no change
      };

      await runSchema(req as any, validateEditClientSupportNeeds());

      // Stub a successful getClientDetails response so handleAddClientSupportNeedsErrors thinks it has info
      apiServiceGetStub.resolves({
        status: 'success'
      });

      // Act
      await postEditClientSupportNeeds(req as RequestWithMiddleware, res as Response, next);

      // Assert - Should render form with "no changes" error, not redirect
      expect(redirectStub.called).to.be.false;
      expect(renderStub.calledWith('case_details/client_support_needs/change-client-support-needs.njk')).to.be.true;
    });

    it('should delegate API errors to Express error handling middleware', async () => {
      // Arrange
      req.body = { 
        clientSupportNeeds: 'bslWebcam',
      };

      // Mock session data to simulate that original data was stored during GET request
      req.session!.clientSupportNeedsOriginal = {
        clientSupportNeeds: 'bslWebcam',
      };

      const error = new Error('API Error');
      apiServiceUpdateStub.rejects(error);

      // Act
      await postEditClientSupportNeeds(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(next.calledOnce).to.be.true;
    });
  });
});
