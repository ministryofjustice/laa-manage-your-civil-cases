/**
 * Edit Client National Insurance number Controller Tests
 * 
 * Tests the Express.js controllers for client details editing functionality.
 * Covers HTTP request/response handling for National Insurance number editing forms including:
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
import type { Request, Response  } from 'express';
import {
  getEditClientNationalInsuranceNumber,
  postEditClientNationalInsuranceNumber
} from '#src/scripts/controllers/editClientNationalInsuranceNumberController.js';
import { apiService } from '#src/services/apiService.js';
// Import to get global type declarations for axiosMiddleware
import '#utils/server/axiosSetup.js';
import { validateEditClientNationalInsuranceNumber } from '#src/middlewares/clientNationalInsuranceNumberSchema.js';
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

describe('Edit Client National Insurance number Controller', () => {
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

  describe('getEditClientNationalInsuranceNumber', () => {
    it('should render National Insurance number editing form with pre-populated client data and CSRF protection', async () => {
      // Arrange
      const mockApiResponse = {
        status: 'success',
        data: {
          nationalInsuranceNumber: 'JM123456C',
          caseReference: 'TEST123'
        }
      };

      apiServiceGetStub.resolves(mockApiResponse);

      // Act
      await getEditClientNationalInsuranceNumber(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(apiServiceGetStub.calledOnce).to.be.true;
      expect(renderStub.calledWith('case_details/edit-client-national-insurance-number.njk')).to.be.true;
    });

    it('should delegate API errors to Express error handling middleware', async () => {
      // Arrange
      const error = new Error('API Error');
      apiServiceGetStub.rejects(error);

      // Act
      await getEditClientNationalInsuranceNumber(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(next.calledOnce).to.be.true;
    });
  });

  describe('postEditClientNationalInsuranceNumber', () => {
    it('should process successful client National Insurance number update and redirect to case details', async () => {
      // Arrange
      req.body = { nationalInsuranceNumber: 'JM123456C' };

      apiServiceUpdateStub.resolves({
        status: 'success',
        data: { nationalInsuranceNumber: 'JM123456C' }
      });

      // Act
      await postEditClientNationalInsuranceNumber(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(apiServiceUpdateStub.calledOnce).to.be.true;
      expect(redirectStub.calledWith('/cases/TEST123/client-details')).to.be.true;
    });

    it('should render validation errors when the National Insurance number format is invalid', async () => {
      // Arrange
      req.body = {
        nationalInsuranceNumber: 'INVALID-NI',
        existingNationalInsuranceNumber: 'JM123456C'
      };

      await runSchema(req as any, validateEditClientNationalInsuranceNumber());

      apiServiceGetStub.resolves({
        status: 'success',
        data: { caseReference: 'TEST123' }
      });

      req.session = {} as any;

      // Act
      await postEditClientNationalInsuranceNumber(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(redirectStub.called).to.be.false;
      expect(statusStub.calledWith(400)).to.be.true;
      expect(renderStub.calledWith('case_details/edit-client-national-insurance-number.njk')).to.be.true;
      expect(apiServiceUpdateStub.called).to.be.false;
    });


    it('should normalise the National Insurance number before updating the client details', async () => {
      // Arrange
      req.body = {
        nationalInsuranceNumber: ' jm 123456 c ',
        existingNationalInsuranceNumber: 'AB123456D'
      };

      await runSchema(req as any, validateEditClientNationalInsuranceNumber());

      apiServiceUpdateStub.resolves({
        status: 'success',
        data: { nationalInsuranceNumber: 'JM123456C' }
      });

      // Act
      await postEditClientNationalInsuranceNumber(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(apiServiceUpdateStub.calledOnce).to.be.true;
      expect(apiServiceUpdateStub.firstCall.args[2]).to.deep.equal({
        ni_number: 'JM123456C'
      });
    });

    it('should set warning banner in session and redirect when no change is made', async () => {
      // Arrange
      req.session = {} as any;
      req.body = {
        nationalInsuranceNumber: 'JM123456C',
        existingNationalInsuranceNumber: 'JM123456C'
      };

      // Act
      await postEditClientNationalInsuranceNumber(req as RequestWithMiddleware, res as Response, next);

      expect(redirectStub.calledOnce).to.be.true;
      expect(redirectStub.calledWith('/cases/TEST123/client-details')).to.be.true;

      expect((req.session as any).noChangeWarningCache.noChangeWarningBanner).to.be.true;

      expect(apiServiceUpdateStub.called).to.be.false;
    });
  });
});
