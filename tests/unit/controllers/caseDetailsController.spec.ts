/**
 * Case Details Controller Tests
 * 
 * Tests the Express.js controller for individual case detail viewing functionality.
 * Covers case detail page routing and data presentation including:
 * - Tab-based navigation handling (details, evidence, proceedings)
 * - API integration for case-specific data retrieval
 * - Error handling and user feedback
 * - Template rendering with case context
 * 
 * Testing Level: Unit (Controller Layer)
 * Component: Express.js Case Detail Controllers
 * Dependencies: apiService, case detail templates
 */

import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';
import type { Request, Response, NextFunction } from 'express';
import { handleCaseDetailsTab } from '#src/scripts/controllers/caseDetailsController.js';
import { apiService } from '#src/services/apiService.js';
// Import to get global type declarations for axiosMiddleware
import '#utils/axiosSetup.js';

describe('Case Details Controller', () => {
  let req: Partial<Request>;
  let res: any;
  let next: any;
  let renderStub: sinon.SinonStub;
  let statusStub: sinon.SinonStub;
  let apiServiceStub: sinon.SinonStub;

  beforeEach(() => {
    req = {
      params: { caseReference: 'TEST123' },
      axiosMiddleware: {} as any
    };
    
    renderStub = sinon.stub();
    statusStub = sinon.stub().returns({ render: renderStub });
    
    res = {
      render: renderStub,
      status: statusStub
    };
    
    next = sinon.stub();
    
    // Stub the API service
    apiServiceStub = sinon.stub(apiService, 'getClientDetails');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('handleCaseDetailsTab', () => {
    it('should render case details page with client data and correct template for specified tab', async () => {
      // Arrange
      const mockApiResponse = {
        status: 'success',
        data: {
          fullName: 'John Doe',
          caseReference: 'TEST123',
          dateOfBirth: '1990-01-01'
        }
      };
      
      apiServiceStub.resolves(mockApiResponse);

      // Act
      await handleCaseDetailsTab(
        req as Request,
        res as Response,
        next,
        'opened'
      );

      // Assert
      expect(apiServiceStub.calledOnce).to.be.true;
      expect(apiServiceStub.calledWith(req.axiosMiddleware, 'TEST123')).to.be.true;
      expect(renderStub.calledWith('case_details/index.njk')).to.be.true;
    });

    it('should return 400 Bad Request status when case reference parameter is missing from URL', async () => {
      // Arrange
      req.params = {};

      // Act
      await handleCaseDetailsTab(
        req as Request,
        res as Response,
        next,
        'details'
      );

      // Assert
      expect(apiServiceStub.called).to.be.false;
      expect(statusStub.calledWith(400)).to.be.true;
    });

    it('should delegate API errors to Express error handling middleware with user-friendly message', async () => {
      // Arrange
      const error = new Error('API Error');
      apiServiceStub.rejects(error);

      // Act
      await handleCaseDetailsTab(
        req as Request,
        res as Response,
        next,
        'details'
      );

      // Assert - the controller should call next with a processed error
      expect(next.calledOnce).to.be.true;
      expect(next.firstCall.args[0]).to.be.instanceOf(Error);
      expect(next.firstCall.args[0].message).to.include('An unexpected error occurred');
    });
  });
});
