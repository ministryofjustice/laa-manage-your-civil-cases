/**
 * Edit Client Date of Birth Controller Tests
 * 
 * Basic regression tests for DOB editing functionality.
 * Covers GET route handler for form display and basic API integration.
 * 
 * Testing Level: Unit (Controller Layer)
 * Component: Express.js Controllers
 * Dependencies: apiService
 */

import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';
import type { Request, Response, NextFunction } from 'express';
import { 
  getEditClientDateOfBirth, 
  postEditClientDateOfBirth
} from '#src/scripts/controllers/editClientDateOfBirthController.js';
import { apiService } from '#src/services/apiService.js';
// Import to get global type declarations for axiosMiddleware
import '#utils/axiosSetup.js';

// Define the RequestWithMiddleware interface for testing
interface RequestWithMiddleware extends Request {
  axiosMiddleware: any;
  csrfToken?: () => string;
}

describe('Edit Client Date of Birth Controller', () => {
  let req: Partial<RequestWithMiddleware>;
  let res: any;
  let next: any;
  let renderStub: sinon.SinonStub;
  let redirectStub: sinon.SinonStub;
  let apiServiceGetStub: sinon.SinonStub;

  beforeEach(() => {
    req = {
      params: { caseReference: 'TEST123' },
      body: {},
      axiosMiddleware: {} as any,
      csrfToken: sinon.stub().returns('mock-csrf-token')
    };

    renderStub = sinon.stub();
    redirectStub = sinon.stub();
    res = {
      render: renderStub,
      redirect: redirectStub
    };

    next = sinon.stub();
    apiServiceGetStub = sinon.stub(apiService, 'getClientDetails');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('getEditClientDateOfBirth', () => {
    it('should render date of birth editing form with client data from API', async () => {
      // Arrange
      const mockApiResponse = {
        status: 'success' as const,
        data: {
          caseReference: 'TEST123',
          fullName: 'John Doe',
          dateOfBirth: '1990-05-15'
        }
      };
      apiServiceGetStub.resolves(mockApiResponse);

      // Act
      await getEditClientDateOfBirth(req as Request, res as Response, next as NextFunction);

      // Assert
      expect(apiServiceGetStub.calledOnce).to.be.true;
      expect(apiServiceGetStub.calledWith(req.axiosMiddleware, 'TEST123')).to.be.true;
      expect(renderStub.calledOnce).to.be.true;
      
      const renderCall = renderStub.getCall(0);
      expect(renderCall.args[0]).to.equal('case_details/edit-date-of-birth.njk');
      
      const renderData = renderCall.args[1];
      expect(renderData.caseReference).to.equal('TEST123');
      expect(renderData.formData.day).to.equal('15');
      expect(renderData.formData.month).to.equal('5');
      expect(renderData.formData.year).to.equal('1990');
      expect(renderData.originalData.day).to.equal('15');
      expect(renderData.originalData.month).to.equal('5');
      expect(renderData.originalData.year).to.equal('1990');
      expect(renderData.errorState.hasErrors).to.be.false;
      expect(renderData.csrfToken).to.equal('mock-csrf-token');
    });

    it('should handle empty date of birth from API', async () => {
      // Arrange
      const mockApiResponse = {
        status: 'success' as const,
        data: {
          caseReference: 'TEST123',
          fullName: 'John Doe',
          dateOfBirth: ''
        }
      };
      apiServiceGetStub.resolves(mockApiResponse);

      // Act
      await getEditClientDateOfBirth(req as Request, res as Response, next as NextFunction);

      // Assert
      const renderData = renderStub.getCall(0).args[1];
      expect(renderData.formData.day).to.equal('');
      expect(renderData.formData.month).to.equal('');
      expect(renderData.formData.year).to.equal('');
    });

    it('should delegate API errors to Express error handling middleware', async () => {
      // Arrange
      const mockError = new Error('API Error');
      apiServiceGetStub.rejects(mockError);

      // Act
      await getEditClientDateOfBirth(req as Request, res as Response, next as NextFunction);

      // Assert
      expect(next.calledOnce).to.be.true;
      expect(next.calledWith(mockError)).to.be.true;
      expect(renderStub.called).to.be.false;
    });
  });

  describe('postEditClientDateOfBirth', () => {
    it('should redirect to client details (placeholder functionality)', async () => {
      // Act
      await postEditClientDateOfBirth(req as Request, res as Response, next as NextFunction);

      // Assert
      expect(redirectStub.calledOnce).to.be.true;
      expect(redirectStub.calledWith('/cases/TEST123/client-details')).to.be.true;
    });
  });
});
