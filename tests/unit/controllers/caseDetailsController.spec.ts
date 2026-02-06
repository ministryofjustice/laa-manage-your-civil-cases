/**
 * Case Details Controller Tests
 * 
 * Tests the Express.js controller for individual case detail viewing functionality.
 * Covers case detail page routing and data presentation including:
 * - Tab-based navigation handling (details, notes, history)
 * - Provider note creation and validation
 * - API integration for case-specific data retrieval
 * - Error handling and user feedback
 * - Template rendering with case context
 * - Form validation and CSRF protection
 * 
 * Testing Level: Unit (Controller Layer)
 * Component: Express.js Case Detail Controllers
 * Dependencies: apiService, clientDetailsApiService, case detail templates
 */

import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';
import type { Request, Response } from 'express';
import { handleCaseDetailsTab, saveProviderNote } from '#src/scripts/controllers/caseDetailsController.js';
import { apiService } from '#src/services/apiService.js';
import { validateProviderNote } from '#src/middlewares/providerNoteSchema.js';
import { ValidationChain } from '#node_modules/express-validator/lib/index.js';
// Import to get global type declarations for axiosMiddleware
import '#utils/server/axiosSetup.js';

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

describe('Case Details Controller', () => {
  let req: Partial<RequestWithMiddleware>;
  let res: any;
  let next: any;
  let renderStub: sinon.SinonStub;
  let redirectStub: sinon.SinonStub;
  let statusStub: sinon.SinonStub;
  let apiServiceStub: sinon.SinonStub;
  let updateProviderNotesStub: sinon.SinonStub;

  beforeEach(() => {
    req = {
      params: { caseReference: 'TEST123' },
      body: {},
      session: {} as any, // Mock session object for session cleanup functionality
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
    
    // Stub the API service
    apiServiceStub = sinon.stub(apiService, 'getClientDetails');
    updateProviderNotesStub = sinon.stub(apiService, 'updateProviderNotes');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('handleCaseDetailsTab', () => {
    it('should render case details page with client data and correct template for specified tab', async () => {
      // Arrange
      const mockClientData = {
        fullName: 'John Doe',
        caseReference: 'TEST123',
        dateOfBirth: '1990-01-01'
      };
      
      // Mock client data from middleware
      req.clientData = mockClientData;

      // Act
      handleCaseDetailsTab(
        req as RequestWithMiddleware,
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
      handleCaseDetailsTab(
        req as RequestWithMiddleware,
        res as Response,
        next,
        'details'
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
      handleCaseDetailsTab(
        req as RequestWithMiddleware,
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

  describe('saveProviderNote', () => {
    it('should save provider note and redirect to case details when valid data provided', async () => {
      // Arrange
      req.body = { providerNote: 'This is a test provider note for the case.' };

      updateProviderNotesStub.resolves({
        status: 'success',
        data: { providerNotes: 'This is a test provider note for the case.' }
      });

      // Act
      await saveProviderNote(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(updateProviderNotesStub.calledOnce).to.be.true;
      expect(redirectStub.calledWith('/cases/TEST123/case-details')).to.be.true;
    });

    it('should handle validation error when note is empty', async () => {
      // Arrange
      req.body = { providerNote: '' };

      await runSchema(req as any, validateProviderNote());

      apiServiceStub.resolves({
        status: 'success',
        data: {
          fullName: 'John Doe',
          caseReference: 'TEST123'
        }
      });

      // Act
      await saveProviderNote(req as RequestWithMiddleware, res as Response, next);

      // Assert - Should render form with errors, not redirect
      expect(redirectStub.called).to.be.false;
      expect(statusStub.calledWith(400)).to.be.true;
      expect(renderStub.calledWith('case_details/index.njk')).to.be.true;
      expect(updateProviderNotesStub.called).to.be.false;
    });

    it('should handle validation error when note exceeds maximum length', async () => {
      // Arrange
      const tooLongNote = 'A'.repeat(2501);
      req.body = { providerNote: tooLongNote };

      await runSchema(req as any, validateProviderNote());

      apiServiceStub.resolves({
        status: 'success',
        data: {
          fullName: 'John Doe',
          caseReference: 'TEST123'
        }
      });

      // Act
      await saveProviderNote(req as RequestWithMiddleware, res as Response, next);

      // Assert - Should render form with errors, not redirect
      expect(redirectStub.called).to.be.false;
      expect(statusStub.calledWith(400)).to.be.true;
      expect(renderStub.calledWith('case_details/index.njk')).to.be.true;
      expect(updateProviderNotesStub.called).to.be.false;
    });

    it('should return 400 Bad Request when case reference parameter is missing', async () => {
      // Arrange
      req.params = {};
      req.body = { providerNote: 'Test note' };

      // Act
      await saveProviderNote(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(updateProviderNotesStub.called).to.be.false;
      expect(statusStub.calledWith(400)).to.be.true;
    });

    it('should delegate API errors to Express error handling middleware', async () => {
      // Arrange
      req.body = { providerNote: 'Test note' };

      const error = new Error('API Error');
      updateProviderNotesStub.rejects(error);

      // Act
      await saveProviderNote(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(next.calledOnce).to.be.true;
      expect(next.firstCall.args[0]).to.be.instanceOf(Error);
    });

    it('should delegate to error handler when case is not found during validation error', async () => {
      // Arrange
      req.body = { providerNote: '' };

      await runSchema(req as any, validateProviderNote());

      apiServiceStub.resolves({
        status: 'error',
        data: null,
        message: 'Case not found'
      });

      // Act
      await saveProviderNote(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(next.calledOnce).to.be.true;
      expect(next.firstCall.args[0]).to.be.instanceOf(Error);
      expect(next.firstCall.args[0].message).to.include('An unexpected error occurred');
    });

    it('should delegate to error handler when exception occurs during validation error handling', async () => {
      // Arrange
      req.body = { providerNote: '' };

      await runSchema(req as any, validateProviderNote());

      const error = new Error('Network error');
      apiServiceStub.rejects(error);

      // Act
      await saveProviderNote(req as RequestWithMiddleware, res as Response, next);

      // Assert
      expect(next.calledOnce).to.be.true;
      expect(next.firstCall.args[0]).to.be.instanceOf(Error);
      expect(next.firstCall.args[0].message).to.include('An unexpected error occurred');
    });
  });
});
