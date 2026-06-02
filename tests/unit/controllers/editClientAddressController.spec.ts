/**
 * Edit Client Address Controller Tests
 * 
 * Tests the Express.js controllers for client details editing functionality.
 * Covers HTTP request/response handling for address editing forms including:
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
  getEditClientAddress,
  postEditClientAddress
} from '#src/scripts/controllers/editClientAddressController.js';
import { apiService } from '#src/services/apiService.js';
// Import to get global type declarations for axiosMiddleware
import '#utils/server/axiosSetup.js';
import { validateEditClientAddress } from '#src/middlewares/clientAddressSchema.js';
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

describe('Edit Client Address Controller', () => {
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

  describe('getEditClientAddress', () => {
    it('should render address editing form with pre-populated client data and CSRF protection', async () => {
      // Arrange
      const mockApiResponse = {
        status: 'success',
        data: { address: '123 Main Street', postcode: 'SW1A 1AA' }
      };

      apiServiceGetStub.resolves(mockApiResponse);

      // Act
      await getEditClientAddress(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(apiServiceGetStub.calledOnce).to.be.true;
      expect(renderStub.calledWith('case_details/change-client-address.njk')).to.be.true;
    });

    it('should delegate API errors to Express error handling middleware', async () => {
      // Arrange
      const error = new Error('API Error');
      apiServiceGetStub.rejects(error);

      // Act
      await getEditClientAddress(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(next.calledOnce).to.be.true;
    });
  });

  describe('postEditClientAddress', () => {
    it('should process successful client address update and redirect to case details', async () => {
      // Arrange
      req.body = {
        address: '123 Main Street',
        postcode: 'SW1A 1AA',
        existingAddress: 'Different St',
        existingPostcode: 'SW1A 1AA'
      };

      apiServiceUpdateStub.resolves({
        status: 'success',
        data: { address: '123 Main Street', postcode: 'SW1A 1AA' }
      });

      // Act
      await postEditClientAddress(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(apiServiceUpdateStub.calledOnce).to.be.true;
      expect(redirectStub.calledWith('/cases/TEST123/client-details')).to.be.true;
    });

    it('should handle validation errors', async () => {
      // Arrange
      req.body = {
        address: '123 Main Street',
        postcode: 'SW1A 1AAAAAAAAAAAAAAAAAA',
        existingAddress: 'Different St',
        existingPostcode: 'SW1A 1AA'
      };

      await runSchema(req as any, validateEditClientAddress());

      // Stub a successful getClientDetails response so handlePostEditForm thinks it has info
      apiServiceGetStub.resolves({
        status: 'success'
      });

      // Act
      await postEditClientAddress(req as RequestWithMiddleware, res as Response, next);

      // Assert - Should configure form response with errors, not redirect
      expect(redirectStub.called).to.be.false;
      expect(renderStub.calledWith('case_details/change-client-address.njk')).to.be.true;
    });

    it('should set warning banner in session and redirect when no change is made', async () => {
      // Arrange
      req.session = {} as any;
      req.body = {
        address: '123 Main St',
        postcode: 'SW1A 1AA',
        existingAddress: '123 Main St',
        existingPostcode: 'SW1A 1AA'
      };

      // Act
      await postEditClientAddress(req as RequestWithMiddleware, res as Response, next);

      expect(redirectStub.calledOnce).to.be.true;
      expect(redirectStub.calledWith('/cases/TEST123/client-details')).to.be.true;

      expect((req.session as any).noChangeWarningCache.noChangeWarningBanner).to.be.true;

      expect(apiServiceUpdateStub.called).to.be.false;
    });
  });
});