/**
 * Remove Client Support Needs Controller Tests
 *
 * Tests the Express.js controller for removing client support needs functionality.
 * Covers client support needs removal confirmation and deletion including:
 * - Confirmation page rendering with validation
 * - API integration for client support needs removal
 * - Error handling and user feedback
 * - Template rendering with case context
 *
 * Testing Level: Unit (Controller Layer)
 * Component: Express.js Remove Client Support Needs Controllers
 * Dependencies: apiService, confirmation templates
 */

import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';
import type { Request, Response, NextFunction } from 'express';
import { getRemoveSupportNeedsConfirmation, deleteClientSupportNeeds } from '#src/scripts/controllers/removeClientSupportNeeds.js';
import { apiService } from '#src/services/apiService.js';
// Import to get global type declarations for axiosMiddleware
import '#utils/axiosSetup.js';

describe('Remove Client Support Needs Controller', () => {
  let req: Partial<Request>;
  let res: any;
  let next: any;
  let renderStub: sinon.SinonStub;
  let statusStub: sinon.SinonStub;
  let redirectStub: sinon.SinonStub;
  let getClientDetailsStub: sinon.SinonStub;
  let deleteClientSupportNeedsStub: sinon.SinonStub;

  beforeEach(() => {
    req = {
      params: { caseReference: 'TEST123' },
      axiosMiddleware: {} as any
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
    deleteClientSupportNeedsStub = sinon.stub(apiService, 'deleteClientSupportNeeds');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('getRemoveSupportNeedsConfirmation', () => {
    it('should render confirmation page when case exists with client support needs data', () => {
      // Arrange
      req.clientData = {
        caseReference: 'TEST123',
        clientSupportNeeds: {
          bslWebcam: 'Yes'
        }
      };

      // Act
      getRemoveSupportNeedsConfirmation(req as Request, res as Response, next);

      // Assert
      expect(renderStub.calledWith('case_details/confirm-remove-client-support-needs.njk', { caseReference: 'TEST123' })).to.be.true;
    });

    it('should return 400 when case reference is missing', async () => {
      // Arrange
      req.params = {};

      // Act
      await getRemoveSupportNeedsConfirmation(req as Request, res as Response, next);

      // Assert
      expect(statusStub.calledWith(400)).to.be.true;
      expect(renderStub.calledWith('main/error.njk', { status: '400', error: 'Invalid case reference' })).to.be.true;
    });

    it('should return 404 when case has no client support needs data', () => {
      // Arrange
      req.clientData = { 
        caseReference: 'TEST123', 
        clientSupportNeeds: null 
      };

      // Act
      getRemoveSupportNeedsConfirmation(req as Request, res as Response, next);

      // Assert
      expect(statusStub.calledWith(404)).to.be.true;
      expect(renderStub.calledWith('main/error.njk', { status: '404', error: 'No client support needs data found for this case' })).to.be.true;
    });
  });

  describe('deleteClientSupportNeeds', () => {
    it('should successfully delete client support needs data and redirect', async () => {
      // Arrange
      deleteClientSupportNeedsStub.resolves({ status: 'success', data: {} });

      // Act
      await deleteClientSupportNeeds(req as Request, res as Response, next);

      // Assert
      expect(deleteClientSupportNeedsStub.calledWith(req.axiosMiddleware, 'TEST123')).to.be.true;
      expect(redirectStub.calledWith('/cases/TEST123/client-details')).to.be.true;
    });

    it('should return 400 when case reference is missing', async () => {
      // Arrange
      req.params = {};

      // Act
      await deleteClientSupportNeeds(req as Request, res as Response, next);

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
        expectedError: 'Failed to remove client support needs',
        shouldRedirect: false
      }
    ];

    deleteErrorScenarios.forEach(({ name, response, expectedError, shouldRedirect }) => {
      it(`should render error page when ${name}`, async () => {
        deleteClientSupportNeedsStub.resolves(response);
        await deleteClientSupportNeeds(req as Request, res as Response, next);
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
      deleteClientSupportNeedsStub.resolves({
        status: 'error',
        data: null,
        message: 'Client support needs data not found (404)'
      });

      // Act
      await deleteClientSupportNeeds(req as Request, res as Response, next);

      // Assert
      expect(redirectStub.calledWith('/cases/TEST123/client-details')).to.be.true;
    });

    it('should delegate exceptions to error middleware', async () => {
      // Arrange
      deleteClientSupportNeedsStub.rejects(new Error('API Error'));

      // Act
      await deleteClientSupportNeeds(req as Request, res as Response, next);

      // Assert
      expect(next.calledOnce).to.be.true;
      expect(next.firstCall.args[0].message).to.include('An unexpected error occurred');
    });
  });
});
