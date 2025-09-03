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
    deleteThirdPartyContactStub = sinon.stub(apiService, 'deleteThirdPartyContact');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('getRemoveThirdPartyConfirmation', () => {
    it('should render confirmation page when case exists with third party data', async () => {
      // Arrange
      getClientDetailsStub.resolves({
        status: 'success',
        data: { caseReference: 'TEST123', thirdParty: { fullName: 'Jane Smith' } }
      });

      // Act
      await getRemoveThirdPartyConfirmation(req as Request, res as Response, next);

      // Assert
      expect(getClientDetailsStub.calledWith(req.axiosMiddleware, 'TEST123')).to.be.true;
      expect(renderStub.calledWith('case_details/confirm-remove-third-party.njk', { caseReference: 'TEST123' })).to.be.true;
    });

    it('should return 400 when case reference is missing', async () => {
      // Arrange
      req.params = {};

      // Act
      await getRemoveThirdPartyConfirmation(req as Request, res as Response, next);

      // Assert
      expect(statusStub.calledWith(400)).to.be.true;
      expect(renderStub.calledWith('main/error.njk', { status: '400', error: 'Invalid case reference' })).to.be.true;
    });

    const errorScenarios = [
      {
        name: 'case has no third party data',
        response: { status: 'success', data: { caseReference: 'TEST123', thirdParty: null } },
        expectedError: 'No third party contact found for this case'
      },
      {
        name: 'API returns error with message',
        response: { status: 'error', data: null, message: 'Case not found' },
        expectedError: 'Case not found'
      },
      {
        name: 'API returns error without message',
        response: { status: 'error', data: null },
        expectedError: 'Case not found'
      }
    ];

    errorScenarios.forEach(({ name, response, expectedError }) => {
      it(`should return 404 when ${name}`, async () => {
        getClientDetailsStub.resolves(response);
        await getRemoveThirdPartyConfirmation(req as Request, res as Response, next);
        expect(statusStub.calledWith(404)).to.be.true;
        expect(renderStub.calledWith('main/error.njk', { status: '404', error: expectedError })).to.be.true;
      });
    });

    it('should delegate exceptions to error middleware', async () => {
      // Arrange
      getClientDetailsStub.rejects(new Error('API Error'));

      // Act
      await getRemoveThirdPartyConfirmation(req as Request, res as Response, next);

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
        name: 'API returns error with message',
        response: { status: 'error', data: null, message: 'Failed to delete' },
        expectedError: 'Failed to delete'
      },
      {
        name: 'API returns error without message',
        response: { status: 'error', data: null },
        expectedError: 'Failed to remove third party contact'
      }
    ];

    deleteErrorScenarios.forEach(({ name, response, expectedError }) => {
      it(`should render error page when ${name}`, async () => {
        deleteThirdPartyContactStub.resolves(response);
        await deleteThirdParty(req as Request, res as Response, next);
        expect(statusStub.calledWith(404)).to.be.true;
        expect(renderStub.calledWith('main/error.njk', { status: '500', error: expectedError })).to.be.true;
      });
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
