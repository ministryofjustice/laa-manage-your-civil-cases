/**
 * Client Details Controller Tests
 * 
 * Tests the Express.js controller for individual case detail viewing functionality.
 * Covers case detail page routing and data presentation including:
 * - Tab-based navigation handling (details, notes, history)
 * - API integration for case-specific data retrieval
 * - Error handling and user feedback
 * - Template rendering with case context
 * 
 * Testing Level: Unit (Controller Layer)
 * Component: Express.js Client Details Controllers
 * Dependencies: apiService, case detail templates
 */

import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';
import type { Request, Response, NextFunction } from 'express';
import {
  handleClientDetailsTab,
  acceptCase,
  completeCase,
  getPendingCaseForm,
  getCloseCaseForm,
  closeCase,
  pendingCase,
  getReopenCaseForm,
  reopenCompletedCase
} from '#src/scripts/controllers/clientDetailsController.js';
import { apiService } from '#src/services/apiService.js';
import { changeCaseStateService } from '#src/services/changeCaseStateService.js';
// Import to get global type declarations for axiosMiddleware
import '#utils/server/axiosSetup.js';
import { ValidationChain } from 'express-validator';

// Run an express-validator schema against a fake request
const runSchema = async (req: any, schema: ValidationChain[] | ValidationChain): Promise<void> => {
  const chains = Array.isArray(schema) ? schema : [schema];
  for (const chain of chains) {
    await chain.run(req);
  }
};

describe('Client Details Controller', () => {
  let req: Partial<Request>;
  let res: any;
  let next: any;
  let renderStub: sinon.SinonStub;
  let statusStub: sinon.SinonStub;
  let apiServiceStub: sinon.SinonStub;

  beforeEach(() => {
    req = {
      params: { caseReference: 'TEST123' },
      session: {} as any, // Mock session object for session cleanup functionality
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

  describe('handleClientDetailsTab', () => {
    it('should render client details page with client data and correct template for specified tab', async () => {
      // Arrange
      const mockClientData = {
        fullName: 'John Doe',
        caseReference: 'TEST123',
        dateOfBirth: '1990-01-01'
      };
      
      // Mock client data from middleware
      req.clientData = mockClientData;

      // Act
      handleClientDetailsTab(
        req as Request,
        res as Response,
        next,
        'opened'
      );

      // Assert - API service should not be called (middleware handles it)
      expect(apiServiceStub.called).to.be.false;
      expect(renderStub.calledWith('case_details/index.njk')).to.be.true;
    });

    it('should return 400 Bad Request status when case reference parameter is missing from URL', async () => {
      // Arrange
      req.params = {};

      // Act
      handleClientDetailsTab(
        req as Request,
        res as Response,
        next,
        'badParam'
      );

      // Assert
      expect(apiServiceStub.called).to.be.false;
      expect(statusStub.calledWith(400)).to.be.true;
    });

    it('should delegate API errors to Express error handling middleware with user-friendly message', async () => {
      // Arrange - simulate an error in rendering or session handling
      const mockClientData = { fullName: 'John Doe', caseReference: 'TEST123' };
      req.clientData = mockClientData;

      // Force an error by making render throw
      renderStub.throws(new Error('Render error'));

      // Act
      handleClientDetailsTab(
        req as Request,
        res as Response,
        next,
        'badParam'
      );

      // Assert - the controller should call next with a processed error
      expect(next.calledOnce).to.be.true;
      expect(next.firstCall.args[0]).to.be.instanceOf(Error);
      expect(next.firstCall.args[0].message).to.include('An unexpected error occurred');
    });
  });

  describe('acceptCase', () => {
    it('should successfully accept a case and redirect', async () => {
      // Arrange
      const acceptCaseStub = sinon.stub(changeCaseStateService, 'acceptCase').resolves();
      const redirectStub = sinon.stub();
      res.redirect = redirectStub;
      req.get = sinon.stub().returns('/cases/TEST123/client-details');

      // Act
      await acceptCase(req as Request, res as Response, next);

      // Assert
      expect(acceptCaseStub.calledOnce).to.be.true;
      expect(acceptCaseStub.calledWith(req.axiosMiddleware, 'TEST123')).to.be.true;
      expect(redirectStub.calledOnce).to.be.true;
    });
  });

  describe('completeCase', () => {
    it('should successfully complete a case and redirect', async () => {
      // Arrange
      const completeCaseStub = sinon.stub(changeCaseStateService, 'completeCase').resolves();
      const redirectStub = sinon.stub();
      res.redirect = redirectStub;
      req.get = sinon.stub().returns('/cases/TEST123/client-details');

      // Act
      await completeCase(req as Request, res as Response, next);

      // Assert
      expect(completeCaseStub.calledOnce).to.be.true;
      expect(completeCaseStub.calledWith(req.axiosMiddleware, 'TEST123')).to.be.true;
      expect(redirectStub.calledOnce).to.be.true;
    });
  });

  describe('getPendingCaseForm', () => {
    it('should successfully render the pending case form', () => {
      // Arrange
      req.clientData = {
        fullName: 'John Doe',
        caseReference: 'TEST123',
        caseStatus: 'new'
      };

      req.csrfToken = sinon.stub().returns('csrf-token');

      // Act
      getPendingCaseForm(req as Request, res as Response, next);

      // Assert
      expect(renderStub.calledWith('case_details/why-pending.njk')).to.be.true;
    });

    it('should not render the pending case form, when the case is anything other than "new"', () => {
      // Arrange
      req.clientData = {
        fullName: 'John Doe',
        caseReference: 'TEST123',
        caseStatus: 'completed' // Completed case visiting `why-pending` page via URL
      };
      const redirectStub = sinon.stub();
      res.redirect = redirectStub;

      req.csrfToken = sinon.stub().returns('csrf-token');

      // Act
      getPendingCaseForm(req as Request, res as Response, next);

      // Assert
      expect(redirectStub.calledWith('/cases/TEST123/client-details')).to.be.true;
    });
  });

  describe('getCloseCaseForm', () => {
    it('should successfully render the close case form', () => {
      // Arrange
      req.clientData = {
        fullName: 'John Doe',
        caseReference: 'TEST123',
        caseStatus: 'pending'
      };

      req.csrfToken = sinon.stub().returns('csrf-token');

      // Act
      getCloseCaseForm(req as Request, res as Response, next);

      // Assert
      expect(renderStub.calledWith('case_details/why-closed.njk')).to.be.true;
    });

    it('should not render the close case form, when the case is anything other than "new" or "pending"', () => {
      // Arrange
      req.clientData = {
        fullName: 'John Doe',
        caseReference: 'TEST123',
        caseStatus: 'completed' // Completed case visiting `why-closed` page via URL
      };
      const redirectStub = sinon.stub();
      res.redirect = redirectStub;

      req.csrfToken = sinon.stub().returns('csrf-token');

      // Act
      getCloseCaseForm(req as Request, res as Response, next);

      // Assert
      expect(redirectStub.calledWith('/cases/TEST123/client-details')).to.be.true;
    });
  });

  describe('closeCase', () => {
    it('should successfully close a case with event code and redirect', async () => {
      // Arrange
      const closeCaseStub = sinon.stub(changeCaseStateService, 'closeCase').resolves();
      const redirectStub = sinon.stub();
      res.redirect = redirectStub;
      req.body = { eventCode: 'TEST_EVENT', closeNote: 'Test note' };

      // Act
      await closeCase(req as Request, res as Response, next);

      // Assert
      expect(closeCaseStub.calledOnce).to.be.true;
      expect(redirectStub.calledWith('/cases/TEST123/do-you-want-to-give-feedback')).to.be.true;
    });
  });

  describe('pendingCase', () => {
    it('should successfully mark a case as pending and redirect', async () => {
      // Arrange
      const pendingCaseStub = sinon.stub(changeCaseStateService, 'pendingCase').resolves();
      const redirectStub = sinon.stub();
      res.redirect = redirectStub;
      req.body = { pendingReason: 'not_ready', otherNote: '' };

      // Act
      await pendingCase(req as Request, res as Response, next);

      // Assert
      expect(pendingCaseStub.calledOnce).to.be.true;
      expect(redirectStub.calledWith('/cases/TEST123/do-you-want-to-give-feedback')).to.be.true;
    });
  });

  describe('getReopenCaseForm', () => {
    it('should successfully render the reopen case form', () => {
      // Arrange
      req.clientData = {
        fullName: 'John Doe',
        caseReference: 'TEST123',
        caseStatus: 'completed'
      };

      req.csrfToken = sinon.stub().returns('csrf-token');

      // Act
      getReopenCaseForm(req as Request, res as Response, 'completedCase', next);

      // Assert
      expect(renderStub.calledWith('case_details/why-reopen-completed-case.njk')).to.be.true;
    });

    it('should not render the `why-reopen-closed-case` form, when the case is anything other than "closed"', () => {
      // Arrange
      req.clientData = {
        fullName: 'John Doe',
        caseReference: 'TEST123',
        caseStatus: 'completed' // Completed case visiting `why-reopen-closed-case` page via URL
      };
      const redirectStub = sinon.stub();
      res.redirect = redirectStub;

      req.csrfToken = sinon.stub().returns('csrf-token');

      // Act
      getReopenCaseForm(req as Request, res as Response, 'closedCase', next);

      // Assert
      expect(redirectStub.calledWith('/cases/TEST123/client-details')).to.be.true;
    });

    it('should not render the `why-reopen-completed-case` form, when the case is anything other than "completed"', () => {
      // Arrange
      req.clientData = {
        fullName: 'John Doe',
        caseReference: 'TEST123',
        caseStatus: 'closed' // Closed case visiting `why-reopen-completed-case` page via URL
      };
      const redirectStub = sinon.stub();
      res.redirect = redirectStub;

      req.csrfToken = sinon.stub().returns('csrf-token');

      // Act
      getReopenCaseForm(req as Request, res as Response, 'completedCase', next);

      // Assert
      expect(redirectStub.calledWith('/cases/TEST123/client-details')).to.be.true;
    });
  });

  describe('reopenCase', () => {
    it('should successfully reopen a case and redirect', async () => {
      // Arrange
      const reopenCaseStub = sinon.stub(changeCaseStateService, 'reopenCase').resolves();
      const redirectStub = sinon.stub();
      res.redirect = redirectStub;
      req.body = { reopenNote: 'Test reopen note' };

      // Act
      await reopenCompletedCase(req as Request, res as Response, next);

      // Assert
      expect(reopenCaseStub.calledOnce).to.be.true;
      expect(redirectStub.calledOnce).to.be.true;
    });
  });
});
