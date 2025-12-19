/**
 * Remove Third Party Controller Tests
 *
 * Tests the Express.js controller for removing third party contact functionality.
 * Covers third party removal confirmation and deletion including:
 * - Confirmation page rendering with validation
 * - API integration for third party removal
 * - Error handling and user feedback
 * - Template rendering with case context
 *
 * Testing Level: Unit (Controller Layer)
 * Component: Express.js Remove Third Party Controllers
 * Dependencies: apiService, confirmation templates
 */

import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';
import type { Request, Response, NextFunction } from 'express';
import { getRemoveThirdPartyConfirmation, deleteThirdParty } from '#src/scripts/controllers/removeThirdPartyController.js';
import { apiService } from '#src/services/apiService.js';
// Import to get global type declarations for axiosMiddleware
import '#utils/axiosSetup.js';

describe('Remove Third Party Controller', () => {
  let req: Partial<Request>;
  let res: any;
  let next: any;
  let renderStub: sinon.SinonStub;
  let statusStub: sinon.SinonStub;
  let redirectStub: sinon.SinonStub;
  let getClientDetailsStub: sinon.SinonStub;
  let deleteThirdPartyContactStub: sinon.SinonStub;

  beforeEach(() => {
    // Restore all stubs first to ensure clean state
    sinon.restore();
    
    req = {
      params: { caseReference: 'TEST123' },
      axiosMiddleware: {} as any,
      session: {} as any // Provide session object for session helpers to use
    };

    renderStub = sinon.stub();
    statusStub = sinon.stub().returns({ render: renderStub });
    redirectStub = sinon.stub();

    res = {
      render: renderStub,
      status: statusStub,
      redirect: redirectStub
    };

    next = sinon.stub();

    // Stub the API service methods
    getClientDetailsStub = sinon.stub(apiService, 'getClientDetails');
    deleteThirdPartyContactStub = sinon.stub(apiService, 'deleteThirdPartyContact');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('getRemoveThirdPartyConfirmation', () => {
    it('should render confirmation page when cache hit with active third party', () => {
      // Arrange
      // Simulate cache hit with active third party (not soft-deleted)
      req.session!.thirdPartyCache = {
        caseReference: 'TEST123',
        hasSoftDeletedThirdParty: 'false',
        cachedAt: String(Date.now())
      };

      // Act
      getRemoveThirdPartyConfirmation(req as Request, res as Response, next);

      // Assert
      expect(getClientDetailsStub.called).to.be.false; // No API call made
      expect(renderStub.calledWith('case_details/confirm-remove-third-party.njk', { caseReference: 'TEST123', client: req.clientData })).to.be.true;
    });

    it('should return 404 when cache hit with soft-deleted third party', () => {
      // Arrange
      // Simulate cache hit with soft-deleted third party
      req.session!.thirdPartyCache = {
        caseReference: 'TEST123',
        hasSoftDeletedThirdParty: 'true',
        cachedAt: String(Date.now())
      };

      // Act
      getRemoveThirdPartyConfirmation(req as Request, res as Response, next);

      // Assert
      expect(getClientDetailsStub.called).to.be.false; // No API call made
      expect(statusStub.calledWith(404)).to.be.true;
      expect(renderStub.calledWith('main/error.njk', { 
        status: '404', 
        error: 'No third party contact found for this case' 
      })).to.be.true;
    });

    it('should return 500 when cache miss (session expired)', () => {
      // Arrange
      // No cache data in session - simulates expired session
      // req.session.thirdPartyCache is undefined

      // Act
      getRemoveThirdPartyConfirmation(req as Request, res as Response, next);

      // Assert
      expect(getClientDetailsStub.called).to.be.false; // No API fallback
      expect(statusStub.calledWith(500)).to.be.true;
      expect(renderStub.calledWith('main/error.njk', { 
        status: '500', 
        error: 'Session expired or invalid. Please reload the case details page.' 
      })).to.be.true;
    });

    it('should return 500 when cache exists but for different case', () => {
      // Arrange
      // Cache exists but for different case reference
      req.session!.thirdPartyCache = {
        caseReference: 'DIFFERENT123',
        hasSoftDeletedThirdParty: 'false',
        cachedAt: String(Date.now())
      };

      // Act
      getRemoveThirdPartyConfirmation(req as Request, res as Response, next);

      // Assert
      expect(getClientDetailsStub.called).to.be.false; // No API fallback
      expect(statusStub.calledWith(500)).to.be.true;
      expect(renderStub.calledWith('main/error.njk', { 
        status: '500', 
        error: 'Session expired or invalid. Please reload the case details page.' 
      })).to.be.true;
    });

    it('should return 400 when case reference is missing', () => {
      // Arrange
      req.params = {};

      // Act
      getRemoveThirdPartyConfirmation(req as Request, res as Response, next);

      // Assert
      expect(statusStub.calledWith(400)).to.be.true;
      expect(renderStub.calledWith('main/error.njk', { status: '400', error: 'Invalid case reference' })).to.be.true;
    });

    it('should delegate exceptions to error middleware', () => {
      // Arrange
      // Force an error by making session helpers throw
      req.session = null as any;

      // Act
      getRemoveThirdPartyConfirmation(req as Request, res as Response, next);

      // Assert
      expect(next.calledOnce).to.be.true;
      expect(next.firstCall.args[0].message).to.include('An unexpected error occurred');
    });
  });

  describe('deleteThirdParty', () => {
    it('should successfully delete third party and redirect', async () => {
      // Arrange
      deleteThirdPartyContactStub.resolves({ status: 'success', data: {} });

      // Act
      await deleteThirdParty(req as Request, res as Response, next);

      // Assert
      expect(deleteThirdPartyContactStub.calledWith(req.axiosMiddleware, 'TEST123')).to.be.true;
      expect(req.session!.thirdPartyCache).to.be.undefined; // Session cache should be cleared
      expect(redirectStub.calledWith('/cases/TEST123/client-details')).to.be.true;
    });

    it('should return 400 when case reference is missing', async () => {
      // Arrange
      req.params = {};

      // Act
      await deleteThirdParty(req as Request, res as Response, next);

      // Assert
      expect(statusStub.calledWith(400)).to.be.true;
      expect(renderStub.calledWith('main/error.njk', { status: '400', error: 'Invalid case reference' })).to.be.true;
    });

    const deleteErrorScenarios = [
      {
        name: 'API returns genuine error',
        response: { status: 'error', data: null, message: 'Database connection failed' },
        expectedError: 'Database connection failed',
        shouldRedirect: false
      },
      {
        name: 'API returns error without message',
        response: { status: 'error', data: null },
        expectedError: 'Failed to remove third party contact',
        shouldRedirect: false
      }
    ];

    deleteErrorScenarios.forEach(({ name, response, expectedError, shouldRedirect }) => {
      it(`should render error page when ${name}`, async () => {
        deleteThirdPartyContactStub.resolves(response);
        await deleteThirdParty(req as Request, res as Response, next);
        if (shouldRedirect) {
          expect(redirectStub.calledWith('/cases/TEST123/client-details')).to.be.true;
        } else {
          expect(statusStub.calledWith(500)).to.be.true;
          expect(renderStub.calledWith('main/error.njk', { status: '500', error: expectedError })).to.be.true;
        }
      });
    });

    it('should redirect when API returns 404 error (idempotent delete)', async () => {
      // Arrange
      deleteThirdPartyContactStub.resolves({
        status: 'error',
        data: null,
        message: 'Third party not found (404)'
      });

      // Act
      await deleteThirdParty(req as Request, res as Response, next);

      // Assert
      expect(req.session!.thirdPartyCache).to.be.undefined; // Session cache should be cleared
      expect(redirectStub.calledWith('/cases/TEST123/client-details')).to.be.true;
    });

    it('should delegate exceptions to error middleware', async () => {
      // Arrange
      deleteThirdPartyContactStub.rejects(new Error('API Error'));

      // Act
      await deleteThirdParty(req as Request, res as Response, next);

      // Assert
      expect(next.calledOnce).to.be.true;
      expect(next.firstCall.args[0].message).to.include('An unexpected error occurred');
    });
  });
});
