/**
 * Edit Client Third Party Controller Tests
 * 
 * Tests the Express.js controllers for client details editing functionality.
 * Covers HTTP request/response handling for name and email editing forms including:
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
  getAddClientThirdParty,
  postAddClientThirdParty
} from '#src/scripts/controllers/addClientThirdPartyController.js';
import { apiService } from '#src/services/apiService.js';
// Import to get global type declarations for axiosMiddleware
import '#utils/axiosSetup.js';
import { validateEditClientThirdParty } from '#src/middlewares/clientThirdPartySchema.js';
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

describe('Edit Client Name Controller', () => {
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
    apiServiceUpdateStub = sinon.stub(apiService, 'addThirdPartyContact');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('getAddClientThirdParty', () => {
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
      await getAddClientThirdParty(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(apiServiceGetStub.calledOnce).to.be.true;
      expect(renderStub.calledWith('case_details/third_party_details/add-client-third-party.njk')).to.be.true;
    });

    it('should delegate API errors to Express error handling middleware', async () => {
      // Arrange
      const error = new Error('API Error');
      apiServiceGetStub.rejects(error);

      // Act
      await getAddClientThirdParty(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(next.calledOnce).to.be.true;
    });
  });

  describe('postAddClientThirdParty', () => {
    it('should process successful addition of client third party name update and redirect to case details', async () => {
      // Arrange
      req.body = { thirdPartyFullName: 'John Carpenter' };

      apiServiceUpdateStub.resolves({
        status: 'success',
        data: { thirdPartyFullName: 'John Carpenter' }
      });

      // Act
      await postAddClientThirdParty(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(apiServiceUpdateStub.calledOnce).to.be.true;
      expect(redirectStub.calledWith('/cases/TEST123/client-details')).to.be.true;
    });

    it('should handle validation errors for client third party name', async () => {
      // Arrange
      req.body = { thirdPartyFullName: '', existingThirdPartyFullName: 'John Carpenter' }; // Empty name should trigger validation

      await runSchema(req as any, validateEditClientThirdParty());

      // Act
      await postAddClientThirdParty(req as RequestWithMiddleware, res as Response, next);

      // Assert - Should configure form response with errors, not redirect
      expect(redirectStub.called).to.be.false;
      expect(renderStub.calledWith('case_details/third_party_details/add-client-third-party.njk')).to.be.true;
    });

    it('should handle validation errors for client third party email', async () => {
      // Arrange
      req.body = { 
        thirdPartyFullName: '', existingThirdPartyFullName: 'John Carpenter', // Make sure name is there as it is mandatory
        thirdPartyEmailAddress: 'invalid-email', existingThirdPartyEmailAddress: '' // Invalid email format
      }; 

      await runSchema(req as any, validateEditClientThirdParty());

      // Act
      await postAddClientThirdParty(req as RequestWithMiddleware, res as Response, next);

      // Assert - Should configure form response with errors, not redirect
      expect(redirectStub.called).to.be.false;
      expect(renderStub.calledWith('case_details/third_party_details/add-client-third-party.njk')).to.be.true;
    });

    it('should handle validation errors for client third party contact number', async () => {
      // Arrange
      req.body = { 
        thirdPartyFullName: '', existingThirdPartyFullName: 'John Carpenter', // Make sure name is there as it is mandatory
        thirdPartyContactNumber: '007', existingThirdPartyContactNumber: '' // Invalid phone number format
      }; 

      await runSchema(req as any, validateEditClientThirdParty());

      // Act
      await postAddClientThirdParty(req as RequestWithMiddleware, res as Response, next);

      // Assert - Should configure form response with errors, not redirect
      expect(redirectStub.called).to.be.false;
      expect(renderStub.calledWith('case_details/third_party_details/add-client-third-party.njk')).to.be.true;
    });

    it('should handle validation errors for client third party radio passphrase set up', async () => {
      // Arrange
      req.body = { 
        thirdPartyFullName: '', existingThirdPartyFullName: 'John Carpenter', // Make sure name is there as it is mandatory
        thirdPartyPassphraseSetUp: '', existingThirdPartyPassphraseSetUp: '' // Empty
      }; 

      await runSchema(req as any, validateEditClientThirdParty());

      // Act
      await postAddClientThirdParty(req as RequestWithMiddleware, res as Response, next);

      // Assert - Should configure form response with errors, not redirect
      expect(redirectStub.called).to.be.false;
      expect(renderStub.calledWith('case_details/third_party_details/add-client-third-party.njk')).to.be.true;
    });

  });
});
