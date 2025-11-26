/**
 * Edit Client Third Party Controller Tests
 * 
 * Tests the Express.js controllers for client third party details editing functionality.
 * Covers HTTP request/response handling for third party editing forms including:
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
  getEditClientThirdParty,
  postEditClientThirdParty
} from '#src/scripts/controllers/editClientThirdPartyController.js';
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

describe('Edit Client Third Party Controller', () => {
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
      path: '/cases/TEST123/client-details/change/third-party', // Add missing path property
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
      status: statusStub
    };

    next = sinon.stub();

    // Stub the API service methods
    apiServiceGetStub = sinon.stub(apiService, 'getClientDetails');
    apiServiceUpdateStub = sinon.stub(apiService, 'updateThirdPartyContact');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('getEditClientThirdParty', () => {
    it('should render form with pre-populated third party data and CSRF protection', async () => {
      // Arrange
      const mockApiResponse = {
        status: 'success',
        data: {
          caseReference: 'TEST123',
          thirdParty: {
            fullName: 'John Doe',
            emailAddress: 'john@example.com',
            contactNumber: '07123456789',
            safeToCall: true,
            address: '123 Test Street\nLondon',
            postcode: 'SW1A 1AA',
            relationshipToClient: {
              selected: ['Family member of friend'],
              available: [
                'Parent or Guardian',
                'Family member of friend',
                'Professional',
                'Legal adviser',
                'Other'
              ]
            },
            passphraseSetUp: {
              selected: ['Yes'],
              available: ['Yes', 'No'],
              passphrase: 'test-passphrase'
            }
          }
        }
      };

      apiServiceGetStub.resolves(mockApiResponse);

      // Act
      await getEditClientThirdParty(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(apiServiceGetStub.calledOnce).to.be.true;
      expect(renderStub.calledWith('case_details/third_party_details/change-client-third-party.njk')).to.be.true;
    });

    it('should delegate API errors to Express error handling middleware', async () => {
      // Arrange
      const error = new Error('API Error');
      apiServiceGetStub.rejects(error);

      // Act
      await getEditClientThirdParty(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(next.calledOnce).to.be.true;
    });
  });

  describe('postEditClientThirdParty', () => {
    it('should process successful third party update and redirect to case details', async () => {
      // Arrange
      req.body = { 
        thirdPartyFullName: 'Jane Smith'
      };

      // Mock session data to simulate that original data was stored during GET request
      req.session!.thirdPartyOriginal = {
        thirdPartyFullName: 'John Doe'
      };

      apiServiceUpdateStub.resolves({
        status: 'success',
        data: { thirdPartyFullName: 'Jane Smith' }
      });

      // Act
      await postEditClientThirdParty(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(apiServiceUpdateStub.calledOnce).to.be.true;
      expect(redirectStub.calledWith('/cases/TEST123/client-details')).to.be.true;
    });

    it('should handle validation errors and re-render form', async () => {
      // Arrange
      req.body = { 
        thirdPartyFullName: '' // Empty name should trigger validation
      };

      await runSchema(req as any, validateEditClientThirdParty());

      // Stub a successful getClientDetails response so handleAddThirdPartyValidationErrors thinks it has info
      apiServiceGetStub.resolves({
        status: 'success'
      });

      // Act
      await postEditClientThirdParty(req as RequestWithMiddleware, res as Response, next);

      // Assert - Should configure form response with errors, not redirect
      expect(redirectStub.called).to.be.false;
      expect(renderStub.calledWith('case_details/third_party_details/change-client-third-party.njk')).to.be.true;
    });

    it('should handle no changes scenario properly', async () => {
      // Arrange - Set up session with original data  
      req.session!.thirdPartyOriginal = {
        thirdPartyFullName: 'John Doe',
        thirdPartyEmailAddress: 'john@example.com'
      };
      
      req.body = { 
        thirdPartyFullName: 'John Doe', // Same value = no change
        thirdPartyEmailAddress: 'john@example.com'
      };

      await runSchema(req as any, validateEditClientThirdParty());

      // Stub a successful getClientDetails response so handleAddThirdPartyValidationErrors thinks it has info
      apiServiceGetStub.resolves({
        status: 'success'
      });

      // Act
      await postEditClientThirdParty(req as RequestWithMiddleware, res as Response, next);

      // Assert - Should render form with "no changes" error, not redirect
      expect(redirectStub.called).to.be.false;
      expect(renderStub.calledWith('case_details/third_party_details/change-client-third-party.njk')).to.be.true;
    });

    it('should delegate API errors to Express error handling middleware', async () => {
      // Arrange
      req.body = { 
        thirdPartyFullName: 'Jane Smith'
      };

      // Mock session data to simulate that original data was stored during GET request
      req.session!.thirdPartyOriginal = {
        thirdPartyFullName: 'John Doe'
      };

      const error = new Error('API Error');
      apiServiceUpdateStub.rejects(error);

      // Act
      await postEditClientThirdParty(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(next.calledOnce).to.be.true;
    });
  });
});
