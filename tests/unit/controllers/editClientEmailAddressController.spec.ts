/**
 * Edit Client Email Address Controller Tests
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
  getEditClientEmailAddress,
  postEditClientEmailAddress
} from '#src/scripts/controllers/editClientEmailAddressController.js';
import { apiService } from '#src/services/apiService.js';
// Import to get global type declarations for axiosMiddleware
import '#utils/axiosSetup.js';
import { validateEditClientEmailAddress } from '#src/middlewares/clientEmailAddressSchema.js';
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

describe('Edit Client Email Address Controller', () => {
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

  describe('getEditClientEmailAddress', () => {
    it('should configure edit email form response with existing data', async () => {
      // Arrange
      const mockApiResponse = {
        status: 'success',
        data: {
          emailAddress: 'john@example.com',
          caseReference: 'TEST123'
        }
      };

      apiServiceGetStub.resolves(mockApiResponse);

      // Act
      await getEditClientEmailAddress(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(apiServiceGetStub.calledOnce).to.be.true;
      expect(renderStub.calledWith('case_details/edit-client-email-address.njk')).to.be.true;
    });

    it('should handle API errors', async () => {
      // Arrange
      const error = new Error('API Error');
      apiServiceGetStub.rejects(error);

      // Act
      await getEditClientEmailAddress(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(next.calledOnce).to.be.true;
    });
  });

  describe('postEditClientEmailAddress', () => {
    it('should process valid email update', async () => {
      // Arrange
      req.body = { emailAddress: 'jane@example.com' };

      apiServiceUpdateStub.resolves({
        status: 'success',
        data: { emailAddress: 'jane@example.com' }
      });

      // Act
      await postEditClientEmailAddress(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(apiServiceUpdateStub.calledOnce).to.be.true;
      expect(redirectStub.calledWith('/cases/TEST123/client-details')).to.be.true;
    });

    it('should handle validation errors', async () => {
      // Arrange
      req.body = {
        emailAddress: 'invalid-email', // Invalid format
        existingEmailAddress: 'valid@example.com' // Provide existing email for validation
      };

      await runSchema(req as any, validateEditClientEmailAddress());

      // Act
      await postEditClientEmailAddress(req as RequestWithMiddleware, res as Response, next);

      // Assert - Should configure form response with errors, not redirect
      expect(redirectStub.called).to.be.false;
      expect(renderStub.calledWith('case_details/edit-client-email-address.njk')).to.be.true;
    });
  });
});
